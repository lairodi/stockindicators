import numpy as np
import pandas as pd

from datavengers_2020.simulation.q_agent import QAgent
from datavengers_2020.simulation.market_simulation import MarketSim


class QLearner(object):
    """
    Q-Learner
    """

    def __init__(self, impact=0.0, indicators_count=5):
        self.impact = impact
        self.discretize_bins = 10
        self.indicators_count = indicators_count
        self.X = None
        self.max_epochs = 100
        self.min_epochs = 15

        # Initialize the QLearner. Number of states is the number of steps raised to the number of indicators
        states = pow(self.discretize_bins, self.indicators_count)
        self.agent = QAgent(num_states=states, num_actions=3)

    def __get_indicators(self):
        insert = 0
        indicators = pd.DataFrame(index=self.X.index)
        if "SMA" in self.X.columns:
            indicators.insert(insert, "SMA", self.X["SMA"])
            insert += 1
        if "EMA" in self.X.columns:
            indicators.insert(insert, "EMA", self.X["EMA"])
            insert += 1
        if "RSI" in self.X.columns:
            indicators.insert(insert, "RSI", self.X["RSI"])
            insert += 1
        if "CCI" in self.X.columns:
            indicators.insert(insert, "CCI", self.X["CCI"])
            insert += 1
        if "Real Upper Band" in self.X.columns:
            percent_b = (self.X["5. adjusted close"] - self.X["Real Lower Band"]) / (
                self.X["Real Upper Band"] - self.X["Real Lower Band"]
            )
            indicators.insert(insert, "Percent_B", percent_b)
            insert += 1

        return indicators

    def __discretization_bins(self, indicators):
        # Calculate step size
        ind_copy = indicators.copy()
        step_size = round(ind_copy.shape[0] / self.discretize_bins)
        thresholds = np.zeros(shape=(ind_copy.shape[1], self.discretize_bins))
        # Calculate thresholds for each indicator
        for i in range(self.indicators_count):
            # Sort by the current indicator
            indicator = ind_copy.columns[i]
            ind_copy.sort_values(by=indicator, inplace=True)
            # Calcualte the thresholds for this indicator
            for step in range(self.discretize_bins):
                # Ensure the last threshold is the largest number...will help for discretizing
                index = -1 if step == self.discretize_bins - 1 else int((step + 1) * step_size)
                thresholds[i, step] = ind_copy[indicator].iloc[index]

        return pd.DataFrame(thresholds, index=ind_copy.columns)

    def __discretize_indicators(self, indicators, thresholds):
        state = ""
        for i, val in indicators.iteritems():
            bin_idx = np.digitize([val], thresholds.loc[i], right=True)
            state += str(bin_idx[0])

        return int(state)

    def __check_convergence(self, returns, history=5):
        converged = False
        # If we dont have enough data for last N epochs then dont check for convergence
        if len(returns) >= history:
            last_n = returns[-history:]
            # No change in the last N cumulative returns
            converged = len(np.unique(last_n)) == 1

        return converged

    def __get_next_order(self, holdings, action):
        order = 0
        if action > 0 and holdings < 1000:
            order = 1000 if holdings == 0 else 2000
        elif action < 0 and holdings > -1000:
            order = -1000 if holdings == 0 else -2000

        return order

    def train(self, symbols, X, cash, shares):
        self.X = X
        indicators = self.__get_indicators()
        thresholds = self.__discretization_bins(indicators)
        epoch_cum_returns = []
        epoch = 1
        cont_learning = True
        while cont_learning:
            # DataFrame indexed by dates with number of trades for each date for the specified symbol
            orders = pd.DataFrame(index=self.X.index, columns=symbols)
            # Start off with no holdings
            holdings = 0
            # Go through each day and learn
            for i, date in enumerate(self.X.index):
                # Starting state
                state = self.__discretize_indicators(indicators.loc[date], thresholds)
                if i != 0:
                    reward = holdings * (
                        ((self.X.loc[date]["5. adjusted close"] / self.X.iloc[i - 1]["5. adjusted close"]) - self.impact) - 1
                    )
                    action = self.agent.query(state, reward)
                else:
                    # Random action to start with
                    action = self.agent.query_set_state(state)

                # Get the next order, if its the last day close out our holdings
                order = -holdings if date == self.X.index[-1] else self.__get_next_order(holdings, action - 1)
                orders[symbols[0]].loc[date] = action - 1
                holdings += order

            # Compute portfolio values and statistics to see how we are doing
            sim = MarketSim(start_cash=cash, start_shares=shares)
            portfolio = sim.simulate_market_order(symbols[0], orders, self.X)
            cr = portfolio.iloc[-1]["value"] / portfolio.iloc[0]["value"]
            epoch_cum_returns.append(cr)

            converged = False
            if epoch > self.min_epochs:
                # Check for convergence
                converged = self.__check_convergence(epoch_cum_returns)

            if epoch == self.max_epochs or converged:
                # If converged or max epochs has been reached stop learning
                cont_learning = False
            else:
                # Continue learning
                epoch += 1

    def predict(self, symbols, X):
        self.X = X
        indicators = self.__get_indicators()
        thresholds = self.__discretization_bins(indicators)
        orders = pd.DataFrame(index=self.X.index, columns=symbols)

        # Go through each day and learn
        for i, date in enumerate(self.X.index):
            # Starting state
            state = self.__discretize_indicators(indicators.loc[date], thresholds)
            action = self.agent.query_set_state(state)

            # Get the next order, if its the last day close out our holdings
            orders[symbols[0]].loc[date] = action - 1

        return orders
