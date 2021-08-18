from typing import List
import pandas as pd

from alpha_vantage.techindicators import TechIndicators
from alpha_vantage.timeseries import TimeSeries

from datavengers_2020.models.stock_data import StockData
from datavengers_2020.models.stock_price import StockPrice
from datavengers_2020.models.indicator import Indicator
from datavengers_2020.models.indicator_value import IndicatorValue
from datavengers_2020 import util

ALPHA_VANTAGE_API_KEYS = [
    "TNG5WJGOPZ8TIOV3",
    "U8GE10LUUO67SB0P",
    "GCCOCWOD97HS7KZW",
    "YVQTWARKU1FJ501D",
    "6XL9GDHQ3W5JVWGE",
    "0E4JVBAGPO2EVDEL",
    "N6XEAABRCX9K2WVQ"
]

KEY_INDEX = 0

def rotate_api_key():
    global KEY_INDEX
    key = ALPHA_VANTAGE_API_KEYS[KEY_INDEX]
    KEY_INDEX = (KEY_INDEX + 1) % len(ALPHA_VANTAGE_API_KEYS)

    print("using key={}".format(key))
    return key


def get_sma_indicator(symbol, start_date, end_date, window):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    ti = TechIndicators(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ti.get_sma(symbol, interval="daily", time_period=window, series_type="close")
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    df = df[start_date:end_date]
    indicator_values = [IndicatorValue(_date=index, value=row["SMA"]) for index, row in df.iterrows()]
    tech_indicator = Indicator(
        symbol,
        indicator="SMA",
        start_date=start_date,
        end_date=end_date,
        window_size=window,
        bandwidth=None,
        values=indicator_values,
    )

    return df, tech_indicator


def get_ema_indicator(symbol, start_date, end_date, window):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    ti = TechIndicators(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ti.get_ema(symbol, interval="daily", time_period=window, series_type="close")
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    df = df[start_date:end_date]
    indicator_values = [IndicatorValue(_date=index, value=row["EMA"]) for index, row in df.iterrows()]
    tech_indicator = Indicator(
        symbol,
        indicator="EMA",
        start_date=start_date,
        end_date=end_date,
        window_size=window,
        bandwidth=None,
        values=indicator_values,
    )

    return df, tech_indicator


def get_rsi_indicator(symbol, start_date, end_date, window):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    ti = TechIndicators(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ti.get_rsi(symbol, interval="daily", time_period=window, series_type="close")
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    df = df[start_date:end_date]
    indicator_values = [IndicatorValue(_date=index, value=row["RSI"]) for index, row in df.iterrows()]
    tech_indicator = Indicator(
        symbol,
        indicator="RSI",
        start_date=start_date,
        end_date=end_date,
        window_size=window,
        bandwidth=None,
        values=indicator_values,
    )

    return df, tech_indicator


def get_cci_indicator(symbol, start_date, end_date, window):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    ti = TechIndicators(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ti.get_cci(symbol, interval="daily", time_period=window)
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    df = df[start_date:end_date]
    indicator_values = [IndicatorValue(_date=index, value=row["CCI"]) for index, row in df.iterrows()]
    tech_indicator = Indicator(
        symbol,
        indicator="CCI",
        start_date=start_date,
        end_date=end_date,
        window_size=window,
        bandwidth=None,
        values=indicator_values,
    )

    return df, tech_indicator


def get_bband_indicator(symbol, start_date, end_date, window, bandwidth):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    bandwidth = bandwidth if bandwidth is not None else 2

    ti = TechIndicators(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ti.get_bbands(
        symbol, interval="daily", time_period=window, series_type="close", nbdevup=bandwidth, nbdevdn=bandwidth, matype=1
    )
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    df = df[start_date:end_date]
    indicator_values = [
        IndicatorValue(
            _date=index, value=row["Real Middle Band"], upper=row["Real Upper Band"], lower=row["Real Lower Band"],
        )
        for index, row in df.iterrows()
    ]
    tech_indicator = Indicator(
        symbol,
        indicator="CCI",
        start_date=start_date,
        end_date=end_date,
        window_size=window,
        bandwidth=bandwidth,
        values=indicator_values,
    )

    return df, tech_indicator


def get_stock_data(symbol, start_date, end_date):
    # start_date = util.deserialize_datetime(start_date)
    # end_date = util.deserialize_datetime(end_date)

    ts = TimeSeries(key=rotate_api_key(), output_format="pandas", indexing_type="date")
    # pylint: disable=unbalanced-tuple-unpacking
    data, _ = ts.get_daily_adjusted(symbol, outputsize="full")
    # pylint: disable=no-member
    df = data.sort_index(ascending=True)
    temp = df[start_date:end_date]
    stock_prices = [
        StockPrice(
            _date=index,
            open=row["1. open"],
            high=row["2. high"],
            low=row["3. low"],
            close=row["4. close"],
            adj_close=row["5. adjusted close"],
            volume=row["6. volume"],
        )
        for index, row in temp.iterrows()
    ]

    stock_data = StockData(symbol, start_date=start_date, end_date=end_date, prices=stock_prices)

    return df, stock_data


def get_indicators_data(symbol, start_Date, end_date, indicators: List[Indicator]):
    indicator_data = []
    for indicator in indicators:
        if "SMA" in indicator.indicator.upper():
            indicator_data.append(get_sma_indicator(symbol, start_Date, end_date, indicator.window_size)[0])

        if "EMA" in indicator.indicator.upper():
            indicator_data.append(get_ema_indicator(symbol, start_Date, end_date, indicator.window_size)[0])

        if "RSI" in indicator.indicator.upper():
            indicator_data.append(get_rsi_indicator(symbol, start_Date, end_date, indicator.window_size)[0])

        if "CCI" in indicator.indicator.upper():
            indicator_data.append(get_cci_indicator(symbol, start_Date, end_date, indicator.window_size)[0])

        if "BB" in indicator.indicator.upper():
            indicator_data.append(
                get_bband_indicator(symbol, start_Date, end_date, indicator.window_size, indicator.bandwidth)[0]
            )

    return indicator_data


def calcualte_percent_b(data, columns):
    percent_b = None
    bb_top = data["Real Upper Band"] if "Real Upper Band" in columns else None
    bb_bottom = data["Real Lower Band"] if "Real Lower Band" in columns else None
    price = data["5. adjusted close"] if "5. adjusted close" in columns else None

    if bb_bottom is not None and bb_bottom is not None and price is not None:
        percent_b = (price - bb_bottom) / (bb_top - bb_bottom)

    return percent_b
