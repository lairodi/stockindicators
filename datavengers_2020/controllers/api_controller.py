import connexion
import six
import flask

from alpha_vantage.timeseries import TimeSeries

from datavengers_2020.models.indicator import Indicator  # noqa: E501
from datavengers_2020.models.indicator_value import IndicatorValue
from datavengers_2020.models.indicator_type import IndicatorType  # noqa: E501
from datavengers_2020.models.simulation_request import SimulationRequest  # noqa: E501
from datavengers_2020.models.simulation_results import SimulationResults  # noqa: E501
from datavengers_2020.models.stock_data import StockData  # noqa: E501
from datavengers_2020.models.stock_price import StockPrice
from datavengers_2020.simulation.simulation_manager import SimulationManager
from datavengers_2020 import util

from datavengers_2020.utils.helpers import rotate_api_key, get_stock_data


def display_home():  # noqa: E501
    """Load UI page

    Displays the UI page  # noqa: E501


    :rtype: str
    """
    return flask.send_from_directory("static", "index.html")


def indicator_values(indicator, ticker, start_date, end_date, window, bandwidth=None):  # noqa: E501
    """get indicator values

    By passing in the appropriate options, you can get stock indicator values for the spcified ticker  # noqa: E501

    :param indicator: indicator for the stock
    :type indicator: str
    :param ticker: symbol ticker for the stock
    :type ticker: str
    :param start_date: start date for indicator data
    :type start_date: str
    :param end_date: end date for indicator data
    :type end_date: str
    :param window: window for calculating the indicator
    :type window: float
    :param bandwidth: bandwidth for bollinger bands
    :type bandwidth: float

    :rtype: Indicator
    """
    start_date = util.deserialize_datetime(start_date)
    end_date = util.deserialize_datetime(end_date)

    return "Not Implements"


def stock_prices(ticker, start_date, end_date):  # noqa: E501
    """get stock prices

    By passing in the appropriate options, you can get stock prices for the spcified ticker  # noqa: E501

    :param ticker: symbol ticker for the stock
    :type ticker: str
    :param start_date: start date for stock price data
    :type start_date: str
    :param end_date: end date for stock price data
    :type end_date: str

    :rtype: StockData
    """

    _, stock_data = get_stock_data(ticker, start_date, end_date)

    return stock_data


def run_simulation(body):  # noqa: E501
    """run simulation

    Run simulation with supplied rules and tickers for a specified time range  # noqa: E501

    :param body: 
    :type body: dict | bytes

    :rtype: SimulationResults
    """

    print("request body = {}".format(body))
    if connexion.request.is_json:
        body = SimulationRequest.from_dict(connexion.request.get_json())

    manager = SimulationManager()
    results = manager.run_simulation(body)

    return results
