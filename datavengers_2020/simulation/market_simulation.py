import pandas as pd
import numpy as np


class MarketSim(object):
    """
    Market orders simulation. Buys or sells orders based on current holding (cash and shares)
    and calcualte portfolio value.
    """

    def __init__(self, start_cash=100000, start_shares=0, commision=0.0, impact=0.0, percent_buy=0.005):
        self._current_cash = start_cash if start_cash > 0 else 100000
        self._current_shares = start_shares
        self._commision = commision
        self._impact = impact
        self._percent_buy = percent_buy

    def simulate_market_order(self, symbol, orders, stock_Data):
        portfolio = pd.DataFrame([], stock_Data.index, columns=["trade", "holding", "cash", "value"])

        for day in np.nditer(stock_Data.index):
            action = orders.loc[day][0]

            num_sares = int(self._current_cash * self._percent_buy)
            shares_cost = stock_Data.loc[day]["5. adjusted close"] * num_sares
            transaction_cost = self._commision + self._impact * shares_cost

            # On the last day just sell of any shares we have
            if day == stock_Data.index[-1] and self._current_shares > 0:
                action = -1
                num_sares = int(self._current_shares)
                shares_cost = stock_Data.loc[day]["5. adjusted close"] * num_sares
                transaction_cost = self._commision + self._impact * shares_cost

            # Buy action makes sure we have enough cash
            if action > 0 and self._current_cash >= shares_cost:
                # if action > 0:
                self._current_shares += num_sares
                self._current_cash -= shares_cost - transaction_cost
                portfolio.loc[day]["trade"] = action * num_sares * 1.0
            # Sell action makes suer we have enough shares to sell
            elif action < 0 and self._current_shares >= num_sares:
                # elif action < 0:
                self._current_shares -= num_sares
                self._current_cash += shares_cost - transaction_cost
                portfolio.loc[day]["trade"] = action * num_sares * 1.0
            else:
                portfolio.loc[day]["trade"] = 0.0

            portfolio.loc[day]["holding"] = self._current_shares
            portfolio.loc[day]["cash"] = self._current_cash
            portfolio.loc[day]["value"] = (
                self._current_cash + stock_Data.loc[day]["5. adjusted close"] * self._current_shares
            )

        # portfolio value
        return portfolio
