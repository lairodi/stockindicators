import pandas as pd
from datetime import timedelta

from datavengers_2020.models.indicator import Indicator
from datavengers_2020.models.indicator_value import IndicatorValue
from datavengers_2020.models.simulation_request import SimulationRequest
from datavengers_2020.models.simulation_results import SimulationResults
from datavengers_2020.models.day_result import DayResult
from datavengers_2020.models.stock_data import StockData
from datavengers_2020.models.stock_price import StockPrice
from datavengers_2020.utils.decorator import singleton
from datavengers_2020 import util

from datavengers_2020.utils.helpers import get_stock_data, get_indicators_data, calcualte_percent_b
from datavengers_2020.simulation.random_forest import RandomForest
from datavengers_2020.simulation.market_simulation import MarketSim
from datavengers_2020.simulation.q_learner import QLearner


@singleton
class SimulationManager(object):
    """
    Singleton object that manages the simulation requests from the client side.
    """

    def __init__(self):
        self._sim_request = None
        self._data = None
        self.X_train = None
        self.y_train = None
        self.X_test = None
        self.indicators = None

    def __load_data(self):
        """
        Loads the stock market data for the entire training and testing periods
        and splits it up into a training set and testing set
        """
        # Get market data for the training and testing periods
        prices = get_stock_data(
            self._sim_request.symbols[0], self._sim_request.training_start_date, self._sim_request.testing_end_date
        )[0]

        # Inidicators data for training and testing periods
        inidcators = get_indicators_data(
            self._sim_request.symbols[0],
            self._sim_request.training_start_date,
            self._sim_request.testing_end_date,
            self._sim_request.indicators,
        )
        merge = inidcators
        merge.insert(0, prices)

        # Stock market data for the entire period forward and backward filling na values
        # Data is also sorted by date index ascending otherwise we would be looking into the future
        self._data = pd.concat(merge, axis=1)
        self._data.fillna(method="ffill", inplace=True)
        self._data.fillna(method="bfill", inplace=True)

        self.X_train = self._data[self._sim_request.training_start_date : self._sim_request.training_end_date].copy()
        self.X_test = self._data[self._sim_request.testing_start_date : self._sim_request.testing_end_date].copy()

        self.__generate_data_labels()

    def __generate_data_labels(self):
        """
        Generates the labels for the stock market data
        1 = Buy
        0 = Hold
        -1 = Sell

        Labels are generated based on the following rules:
            Buy_t = if Close_t+1 > High_t and Low_t+1 > Low_t
            Sell_t = if Close_t+1 < Low_t and High_t+1 < High_t
            Hold_t = otherwise
        """
        self.y_train = pd.DataFrame([], index=self.X_train.index, columns=["label"])
        end_date = self.X_train.index[-1]

        prev_high = None
        prev_low = None
        prev_date = None
        for date, row in self.X_train.iterrows():
            if prev_high is None and prev_low is None and prev_date is None:
                prev_high = row["2. high"]
                prev_low = row["3. low"]
                prev_date = date
                continue

            # BUY
            if row["4. close"] > prev_high and row["3. low"] > prev_low:
                self.y_train.at[prev_date, "label"] = 1
            # Sell
            elif row["4. close"] < prev_low and row["2. high"] < prev_high:
                self.y_train.at[prev_date, "label"] = -1
            # Hold
            else:
                self.y_train.at[prev_date, "label"] = 0

            if date.date() == end_date.date():
                # Use previous label is probably safe enough for now
                # should really grab more data, will come back to this if there is time
                continue
            else:
                # Update previous day values
                prev_high = row["2. high"]
                prev_low = row["3. low"]
                prev_date = date

        self.y_train.at[date, "label"] = self.y_train.at[prev_date, "label"]

    def __run_market_simulation(self, orders, stock_data):
        symbol = self._sim_request.symbols[0]
        cash = self._sim_request.initial_condition[0].cash
        shares = self._sim_request.initial_condition[0].share

        market_sim = MarketSim(start_cash=cash, start_shares=shares)
        portfolio = market_sim.simulate_market_order(symbol, orders, stock_data)

        results = pd.concat([stock_data, portfolio], axis=1)
        day_results = [
            DayResult(
                _date=index,
                open=row["1. open"],
                high=row["2. high"],
                low=row["3. low"],
                close=row["4. close"],
                adj_close=row["5. adjusted close"],
                volume=row["6. volume"],
                sma=row["SMA"] if "SMA" in results.columns else None,
                ema=row["EMA"] if "EMA" in results.columns else None,
                bb_top=row["Real Upper Band"] if "Real Upper Band" in results.columns else None,
                bb_bottom=row["Real Lower Band"] if "Real Lower Band" in results.columns else None,
                percent_b=calcualte_percent_b(row, results.columns),
                rsi=row["RSI"] if "RSI" in results.columns else None,
                cci=row["CCI"] if "CCI" in results.columns else None,
                trade=row["trade"],
                holding=row["holding"],
                cash=row["cash"],
                value=row["value"],
            )
            for index, row in results.iterrows()
        ]

        return day_results

    def run_simulation(self, sim_ruquest: SimulationRequest) -> "SimulationResults":
        """
        Runs the maket trading simulation with the specified parameters specified in the SimulationRequest
        
        Returns:
            SimulationResults -- Results of the stock market simulation on both training and testing data
        """
        self._sim_request = sim_ruquest
        self.__load_data()

        orders_train = pd.DataFrame([], index=self.X_train.index, columns=self._sim_request.symbols)
        orders_test = pd.DataFrame([], index=self.X_test.index, columns=self._sim_request.symbols)
        if "RF" in self._sim_request.algorithm[0].upper():
            # Random forest
            rf = RandomForest()
            rf.train(self.X_train.to_numpy(), self.y_train.to_numpy().astype("int"))

            # Training predictions
            predict_train = rf.predict(self.X_train.to_numpy())
            orders_train = pd.DataFrame(predict_train, index=self.X_train.index, columns=self._sim_request.symbols)

            # Testing predictions
            predict_test = rf.predict(self.X_test.to_numpy())
            orders_test = pd.DataFrame(predict_test, index=self.X_test.index, columns=self._sim_request.symbols)
        else:
            # Q-learner training
            q_learner = QLearner(indicators_count=len(self._sim_request.indicators))
            q_learner.train(
                self._sim_request.symbols,
                self.X_train,
                self._sim_request.initial_condition[0].cash,
                self._sim_request.initial_condition[0].share,
            )

            orders_train = q_learner.predict(self._sim_request.symbols, self.X_train)
            orders_test = q_learner.predict(self._sim_request.symbols, self.X_test)

        # Perform market orders for training and test
        train_day_result = self.__run_market_simulation(orders_train, self.X_train)
        test_day_result = self.__run_market_simulation(orders_test, self.X_test)

        return SimulationResults(train=train_day_result, test=test_day_result)
