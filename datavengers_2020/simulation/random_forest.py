from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


class RandomForest(object):
    """
    Random Forst Classifier wrapper for scikit-learn

    """

    def __init__(self, n_trees=500, max_depth=20):
        self._forest = RandomForestClassifier(n_estimators=n_trees, max_depth=max_depth)

    def train(self, X, y):
        self._forest.fit(X, y)
        print(accuracy_score(y, self.predict(X)))

    def predict(self, X):
        return self._forest.predict(X)

