# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from datavengers_2020.models.base_model_ import Model
from datavengers_2020 import util


class DayResult(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """
    def __init__(self, _date: datetime=None, open: float=None, high: float=None, low: float=None, close: float=None, adj_close: float=None, volume: float=None, sma: float=None, ema: float=None, bb_top: float=None, bb_bottom: float=None, percent_b: float=None, rsi: float=None, cci: float=None, trade: float=None, holding: float=None, cash: float=None, value: float=None):  # noqa: E501
        """DayResult - a model defined in Swagger

        :param _date: The _date of this DayResult.  # noqa: E501
        :type _date: datetime
        :param open: The open of this DayResult.  # noqa: E501
        :type open: float
        :param high: The high of this DayResult.  # noqa: E501
        :type high: float
        :param low: The low of this DayResult.  # noqa: E501
        :type low: float
        :param close: The close of this DayResult.  # noqa: E501
        :type close: float
        :param adj_close: The adj_close of this DayResult.  # noqa: E501
        :type adj_close: float
        :param volume: The volume of this DayResult.  # noqa: E501
        :type volume: float
        :param sma: The sma of this DayResult.  # noqa: E501
        :type sma: float
        :param ema: The ema of this DayResult.  # noqa: E501
        :type ema: float
        :param bb_top: The bb_top of this DayResult.  # noqa: E501
        :type bb_top: float
        :param bb_bottom: The bb_bottom of this DayResult.  # noqa: E501
        :type bb_bottom: float
        :param percent_b: The percent_b of this DayResult.  # noqa: E501
        :type percent_b: float
        :param rsi: The rsi of this DayResult.  # noqa: E501
        :type rsi: float
        :param cci: The cci of this DayResult.  # noqa: E501
        :type cci: float
        :param trade: The trade of this DayResult.  # noqa: E501
        :type trade: float
        :param holding: The holding of this DayResult.  # noqa: E501
        :type holding: float
        :param cash: The cash of this DayResult.  # noqa: E501
        :type cash: float
        :param value: The value of this DayResult.  # noqa: E501
        :type value: float
        """
        self.swagger_types = {
            '_date': datetime,
            'open': float,
            'high': float,
            'low': float,
            'close': float,
            'adj_close': float,
            'volume': float,
            'sma': float,
            'ema': float,
            'bb_top': float,
            'bb_bottom': float,
            'percent_b': float,
            'rsi': float,
            'cci': float,
            'trade': float,
            'holding': float,
            'cash': float,
            'value': float
        }

        self.attribute_map = {
            '_date': 'date',
            'open': 'open',
            'high': 'high',
            'low': 'low',
            'close': 'close',
            'adj_close': 'adj_close',
            'volume': 'volume',
            'sma': 'sma',
            'ema': 'ema',
            'bb_top': 'bb_top',
            'bb_bottom': 'bb_bottom',
            'percent_b': 'percent_b',
            'rsi': 'rsi',
            'cci': 'cci',
            'trade': 'trade',
            'holding': 'holding',
            'cash': 'cash',
            'value': 'value'
        }
        self.__date = _date
        self._open = open
        self._high = high
        self._low = low
        self._close = close
        self._adj_close = adj_close
        self._volume = volume
        self._sma = sma
        self._ema = ema
        self._bb_top = bb_top
        self._bb_bottom = bb_bottom
        self._percent_b = percent_b
        self._rsi = rsi
        self._cci = cci
        self._trade = trade
        self._holding = holding
        self._cash = cash
        self._value = value

    @classmethod
    def from_dict(cls, dikt) -> 'DayResult':
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The DayResult of this DayResult.  # noqa: E501
        :rtype: DayResult
        """
        return util.deserialize_model(dikt, cls)

    @property
    def _date(self) -> datetime:
        """Gets the _date of this DayResult.


        :return: The _date of this DayResult.
        :rtype: datetime
        """
        return self.__date

    @_date.setter
    def _date(self, _date: datetime):
        """Sets the _date of this DayResult.


        :param _date: The _date of this DayResult.
        :type _date: datetime
        """
        if _date is None:
            raise ValueError("Invalid value for `_date`, must not be `None`")  # noqa: E501

        self.__date = _date

    @property
    def open(self) -> float:
        """Gets the open of this DayResult.


        :return: The open of this DayResult.
        :rtype: float
        """
        return self._open

    @open.setter
    def open(self, open: float):
        """Sets the open of this DayResult.


        :param open: The open of this DayResult.
        :type open: float
        """
        if open is None:
            raise ValueError("Invalid value for `open`, must not be `None`")  # noqa: E501

        self._open = open

    @property
    def high(self) -> float:
        """Gets the high of this DayResult.


        :return: The high of this DayResult.
        :rtype: float
        """
        return self._high

    @high.setter
    def high(self, high: float):
        """Sets the high of this DayResult.


        :param high: The high of this DayResult.
        :type high: float
        """
        if high is None:
            raise ValueError("Invalid value for `high`, must not be `None`")  # noqa: E501

        self._high = high

    @property
    def low(self) -> float:
        """Gets the low of this DayResult.


        :return: The low of this DayResult.
        :rtype: float
        """
        return self._low

    @low.setter
    def low(self, low: float):
        """Sets the low of this DayResult.


        :param low: The low of this DayResult.
        :type low: float
        """
        if low is None:
            raise ValueError("Invalid value for `low`, must not be `None`")  # noqa: E501

        self._low = low

    @property
    def close(self) -> float:
        """Gets the close of this DayResult.


        :return: The close of this DayResult.
        :rtype: float
        """
        return self._close

    @close.setter
    def close(self, close: float):
        """Sets the close of this DayResult.


        :param close: The close of this DayResult.
        :type close: float
        """
        if close is None:
            raise ValueError("Invalid value for `close`, must not be `None`")  # noqa: E501

        self._close = close

    @property
    def adj_close(self) -> float:
        """Gets the adj_close of this DayResult.


        :return: The adj_close of this DayResult.
        :rtype: float
        """
        return self._adj_close

    @adj_close.setter
    def adj_close(self, adj_close: float):
        """Sets the adj_close of this DayResult.


        :param adj_close: The adj_close of this DayResult.
        :type adj_close: float
        """
        if adj_close is None:
            raise ValueError("Invalid value for `adj_close`, must not be `None`")  # noqa: E501

        self._adj_close = adj_close

    @property
    def volume(self) -> float:
        """Gets the volume of this DayResult.


        :return: The volume of this DayResult.
        :rtype: float
        """
        return self._volume

    @volume.setter
    def volume(self, volume: float):
        """Sets the volume of this DayResult.


        :param volume: The volume of this DayResult.
        :type volume: float
        """
        if volume is None:
            raise ValueError("Invalid value for `volume`, must not be `None`")  # noqa: E501

        self._volume = volume

    @property
    def sma(self) -> float:
        """Gets the sma of this DayResult.


        :return: The sma of this DayResult.
        :rtype: float
        """
        return self._sma

    @sma.setter
    def sma(self, sma: float):
        """Sets the sma of this DayResult.


        :param sma: The sma of this DayResult.
        :type sma: float
        """

        self._sma = sma

    @property
    def ema(self) -> float:
        """Gets the ema of this DayResult.


        :return: The ema of this DayResult.
        :rtype: float
        """
        return self._ema

    @ema.setter
    def ema(self, ema: float):
        """Sets the ema of this DayResult.


        :param ema: The ema of this DayResult.
        :type ema: float
        """

        self._ema = ema

    @property
    def bb_top(self) -> float:
        """Gets the bb_top of this DayResult.


        :return: The bb_top of this DayResult.
        :rtype: float
        """
        return self._bb_top

    @bb_top.setter
    def bb_top(self, bb_top: float):
        """Sets the bb_top of this DayResult.


        :param bb_top: The bb_top of this DayResult.
        :type bb_top: float
        """

        self._bb_top = bb_top

    @property
    def bb_bottom(self) -> float:
        """Gets the bb_bottom of this DayResult.


        :return: The bb_bottom of this DayResult.
        :rtype: float
        """
        return self._bb_bottom

    @bb_bottom.setter
    def bb_bottom(self, bb_bottom: float):
        """Sets the bb_bottom of this DayResult.


        :param bb_bottom: The bb_bottom of this DayResult.
        :type bb_bottom: float
        """

        self._bb_bottom = bb_bottom

    @property
    def percent_b(self) -> float:
        """Gets the percent_b of this DayResult.


        :return: The percent_b of this DayResult.
        :rtype: float
        """
        return self._percent_b

    @percent_b.setter
    def percent_b(self, percent_b: float):
        """Sets the percent_b of this DayResult.


        :param percent_b: The percent_b of this DayResult.
        :type percent_b: float
        """

        self._percent_b = percent_b

    @property
    def rsi(self) -> float:
        """Gets the rsi of this DayResult.


        :return: The rsi of this DayResult.
        :rtype: float
        """
        return self._rsi

    @rsi.setter
    def rsi(self, rsi: float):
        """Sets the rsi of this DayResult.


        :param rsi: The rsi of this DayResult.
        :type rsi: float
        """

        self._rsi = rsi

    @property
    def cci(self) -> float:
        """Gets the cci of this DayResult.


        :return: The cci of this DayResult.
        :rtype: float
        """
        return self._cci

    @cci.setter
    def cci(self, cci: float):
        """Sets the cci of this DayResult.


        :param cci: The cci of this DayResult.
        :type cci: float
        """

        self._cci = cci

    @property
    def trade(self) -> float:
        """Gets the trade of this DayResult.


        :return: The trade of this DayResult.
        :rtype: float
        """
        return self._trade

    @trade.setter
    def trade(self, trade: float):
        """Sets the trade of this DayResult.


        :param trade: The trade of this DayResult.
        :type trade: float
        """
        if trade is None:
            raise ValueError("Invalid value for `trade`, must not be `None`")  # noqa: E501

        self._trade = trade

    @property
    def holding(self) -> float:
        """Gets the holding of this DayResult.


        :return: The holding of this DayResult.
        :rtype: float
        """
        return self._holding

    @holding.setter
    def holding(self, holding: float):
        """Sets the holding of this DayResult.


        :param holding: The holding of this DayResult.
        :type holding: float
        """
        if holding is None:
            raise ValueError("Invalid value for `holding`, must not be `None`")  # noqa: E501

        self._holding = holding

    @property
    def cash(self) -> float:
        """Gets the cash of this DayResult.


        :return: The cash of this DayResult.
        :rtype: float
        """
        return self._cash

    @cash.setter
    def cash(self, cash: float):
        """Sets the cash of this DayResult.


        :param cash: The cash of this DayResult.
        :type cash: float
        """
        if cash is None:
            raise ValueError("Invalid value for `cash`, must not be `None`")  # noqa: E501

        self._cash = cash

    @property
    def value(self) -> float:
        """Gets the value of this DayResult.


        :return: The value of this DayResult.
        :rtype: float
        """
        return self._value

    @value.setter
    def value(self, value: float):
        """Sets the value of this DayResult.


        :param value: The value of this DayResult.
        :type value: float
        """
        if value is None:
            raise ValueError("Invalid value for `value`, must not be `None`")  # noqa: E501

        self._value = value
