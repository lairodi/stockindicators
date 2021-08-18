# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from datavengers_2020.models.base_model_ import Model
from datavengers_2020 import util


class InitialCondition(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """
    def __init__(self, cash: float=None, share: float=None):  # noqa: E501
        """InitialCondition - a model defined in Swagger

        :param cash: The cash of this InitialCondition.  # noqa: E501
        :type cash: float
        :param share: The share of this InitialCondition.  # noqa: E501
        :type share: float
        """
        self.swagger_types = {
            'cash': float,
            'share': float
        }

        self.attribute_map = {
            'cash': 'cash',
            'share': 'share'
        }
        self._cash = cash
        self._share = share

    @classmethod
    def from_dict(cls, dikt) -> 'InitialCondition':
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The InitialCondition of this InitialCondition.  # noqa: E501
        :rtype: InitialCondition
        """
        return util.deserialize_model(dikt, cls)

    @property
    def cash(self) -> float:
        """Gets the cash of this InitialCondition.


        :return: The cash of this InitialCondition.
        :rtype: float
        """
        return self._cash

    @cash.setter
    def cash(self, cash: float):
        """Sets the cash of this InitialCondition.


        :param cash: The cash of this InitialCondition.
        :type cash: float
        """
        if cash is None:
            raise ValueError("Invalid value for `cash`, must not be `None`")  # noqa: E501

        self._cash = cash

    @property
    def share(self) -> float:
        """Gets the share of this InitialCondition.


        :return: The share of this InitialCondition.
        :rtype: float
        """
        return self._share

    @share.setter
    def share(self, share: float):
        """Sets the share of this InitialCondition.


        :param share: The share of this InitialCondition.
        :type share: float
        """
        if share is None:
            raise ValueError("Invalid value for `share`, must not be `None`")  # noqa: E501

        self._share = share