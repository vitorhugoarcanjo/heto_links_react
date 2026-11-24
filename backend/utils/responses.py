"""Padronização das respostas JSON da API."""

from flask import jsonify


def json_ok(data=None, message: str = "OK", status: int = 200):
    return jsonify({"success": True, "data": data, "message": message}), status


def json_erro(message: str, status: int = 400, data=None):
    return jsonify({"success": False, "data": data, "message": message}), status