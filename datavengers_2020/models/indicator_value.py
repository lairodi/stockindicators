# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from datavengers_2020.models.base_model_ import Model
from datavengers_2020 import util


class IndicatorValue(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """
    def __init__(self, _date: datetime=None, value: float=None, upper: float=None, lower: float=None):  # noqa: E501
        """IndicatorValue - a model defined in Swagger

        :param _date: The _date of this IndicatorValue.  # noqa: E501
        :type _date: datetime
        :param value: The value of this IndicatorValue.  # noqa: E501
        :type value: float
        :param upper: The upper of this IndicatorValue.  # noqa: E501
        :type upper: float
        :param lower: The lower of this IndicatorValue.  # noqa: E501
        :type lower: float
        """
        self.swagger_types = {
            '_date': datetime,
            'value': float,
            'upper': float,
            'lower': float
        }

        self.attribute_map = {
            '_date': 'date',
            'value': 'value',
            'upper': 'upper',
            'lower': 'lower'
        }
        self.__date = _date
        self._value = value
        self._upper = upper
        self._lower = lower

    @classmethod
    def from_dict(cls, dikt) -> 'IndicatorValue':
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The IndicatorValue of this IndicatorValue.  # noqa: E501
        :rtype: IndicatorValue
        """
        return util.deserialize_model(dikt, cls)

    @property
    def _date(self) -> datetime:
        """Gets the _date of this IndicatorValue.


        :return: The _date of this IndicatorValue.
        :rtype: datetime
        """
        return self.__date

    @_date.setter
    def _date(self, _date: datetime):
        """Sets the _date of this IndicatorValue.


        :param _date: The _date of this IndicatorValue.
        :type _date: datetime
        """
        if _date is None:
            raise ValueError("Invalid value for `_date`, must not be `None`")  # noqa: E501

        self.__date = _date

    @property
    def value(self) -> float:
        """Gets the value of this IndicatorValue.

        In bollinger bands this indicates middle band value, otherwise indicator value  # noqa: E501

        :return: The value of this IndicatorValue.
        :rtype: float
        """
        return self._value

    @value.setter
    def value(self, value: float):
        """Sets the value of this IndicatorValue.

        In bollinger bands this indicates middle band value, otherwise indicator value  # noqa: E501

        :param value: The value of this IndicatorValue.
        :type value: float
        """
        if value is None:
            raise ValueError("Invalid value for `value`, must not be `None`")  # noqa: E501

        self._value = value

    @property
    def upper(self) -> float:
        """Gets the upper of this IndicatorValue.

        Only used for bollinger bands, this indicates upper band value  # noqa: E501

        :return: The upper of this IndicatorValue.
        :rtype: float
        """
        return self._upper

    @upper.setter
    def upper(self, upper: float):
        """Sets the upper of this IndicatorValue.

        Only used for bollinger bands, this indicates upper band value  # noqa: E501

        :param upper: The upper of this IndicatorValue.
        :type upper: float
        """

        self._upper = upper

    @property
    def lower(self) -> float:
        """Gets the lower of this IndicatorValue.

        Only used for bollinger bands, this indicates lower band value  # noqa: E501

        :return: The lower of this IndicatorValue.
        :rtype: float
        """
        return self._lower

    @lower.setter
    def lower(self, lower: float):
        """Sets the lower of this IndicatorValue.

        Only used for bollinger bands, this indicates lower band value  # noqa: E501

        :param lower: The lower of this IndicatorValue.
        :type lower: float
        """

        self._lower = lower
