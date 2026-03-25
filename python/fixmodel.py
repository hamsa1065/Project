# save this as fix_model.py in your python/ folder
import pickle
import numpy as np

with open('F:\\dementia-biotracker\\python\\dementia_model.pkl', 'rb') as f:
    saved = pickle.load(f)

# Strip numpy random states from all estimators
def strip_random_state(obj):
    if hasattr(obj, 'random_state'):
        obj.random_state = 42
    if hasattr(obj, 'estimators_'):
        for est in obj.estimators_:
            strip_random_state(est)

strip_random_state(saved['model'])

# Resave with lowest compatible protocol
with open('dementia_model.pkl', 'wb') as f:
    pickle.dump(saved, f, protocol=2)

print('Done!')