#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Oct  7 19:04:39 2026

@author: aryanagnihotri
"""

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Step 1: UNDERSTAND  DataScience_Jobs.csv  (EDA + plots)
Step 2: TRAIN       models that predict a job's AVERAGE SALARY (LPA)
Step 3: SAVE        the best model + a predict() helper for new inputs

Run:    python understand_and_train.py
Needs:  pip install pandas numpy matplotlib scikit-learn joblib
Output: folder  model_outputs/  with plots (.png) and  salary_model.joblib
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")                      # saves plots to files; remove this line to pop up windows
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

CSV_PATH = "/Users/aryanagnihotri/Downloads/SAS Data Problem Statement and Instructions Hackathon/DataScience Jobs.csv"
OUT_DIR = "model_outputs"
RANDOM_STATE = 42
os.makedirs(OUT_DIR, exist_ok=True)


def save_plot(name):
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, name), dpi=130)
    plt.close()


df = pd.read_csv(CSV_PATH)
for c in ["avg_salary", "min_salary", "max_salary"]:          # "7.8L" -> 7.8
    df[c] = pd.to_numeric(df[c].astype(str).str.replace(r"[^0-9.]", "", regex=True))
df["company_name"] = df["company_name"].str.strip()
df["job_title"] = df["job_title"].str.strip()

df["is_senior"] = df["job_title"].str.startswith("Senior").astype(int)
df["base_role"] = df["job_title"].str.replace("Senior ", "", regex=False)

print("=" * 70)
print("DATASET OVERVIEW")
print("=" * 70)
print("Shape               :", df.shape)
print("Unique companies    :", df["company_name"].nunique())
print("Unique job titles   :", df["job_title"].nunique())
print("Missing values      :", int(df.isna().sum().sum()))
print("Duplicate rows      :", int(df.duplicated().sum()))
print("\nNumeric summary:")
print(df[["min_experience", "avg_salary", "min_salary", "max_salary", "num_of_jobs"]].describe().round(2))

print("\nRows per job title:")
print(df["job_title"].value_counts())

print("\nTop 10 companies by openings:")
print(df.groupby("company_name")["num_of_jobs"].sum().sort_values(ascending=False).head(10))

print("\nAverage salary (LPA) by job title:")
print(df.groupby("job_title")["avg_salary"].mean().sort_values(ascending=False).round(1))

print("\nAverage salary (LPA) by minimum experience:")
print(df.groupby("min_experience")["avg_salary"].agg(["mean", "count"]).round(1))

corr = df[["min_experience", "avg_salary", "min_salary", "max_salary", "num_of_jobs"]].corr()
print("\nCorrelation with avg_salary:")
print(corr["avg_salary"].round(2))

# ---- Plots ----
fig, ax = plt.subplots(2, 2, figsize=(12, 9))
ax[0, 0].hist(df["avg_salary"], bins=40, color="#4C78A8")
ax[0, 0].set(title="Distribution of average salary", xlabel="LPA", ylabel="Rows")
df.groupby("job_title")["avg_salary"].mean().sort_values().plot.barh(ax=ax[0, 1], color="#F58518")
ax[0, 1].set(title="Average salary by job title", xlabel="LPA")
exp_mean = df.groupby("min_experience")["avg_salary"].mean()
ax[1, 0].plot(exp_mean.index, exp_mean.values, marker="o", color="#54A24B")
ax[1, 0].set(title="Salary vs minimum experience", xlabel="Years", ylabel="Avg LPA")
ax[1, 0].grid(True)
ax[1, 1].scatter(df["num_of_jobs"], df["avg_salary"], alpha=0.4, color="#E45756")
ax[1, 1].set(title="Openings vs salary", xlabel="Number of jobs (log scale)", ylabel="Avg LPA", xscale="log")
save_plot("01_eda_overview.png")

plt.figure(figsize=(6, 5))
plt.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
plt.xticks(range(len(corr)), corr.columns, rotation=45, ha="right")
plt.yticks(range(len(corr)), corr.columns)
for i in range(len(corr)):
    for j in range(len(corr)):
        plt.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=8)
plt.colorbar()
plt.title("Correlation heatmap")
save_plot("02_correlation.png")

TARGET = "avg_salary"
CAT = ["company_name", "job_title", "base_role"]
NUM = ["min_experience", "num_of_jobs", "is_senior"]

X = df[CAT + NUM]
y = df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)
print(f"\nTrain rows: {len(X_train)} | Test rows: {len(X_test)}")


def make_pipeline(model):
    prep = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT),
        ("num", "passthrough", NUM),
    ])
    return Pipeline([("prep", prep), ("model", model)])


models = {
    "Ridge Regression": make_pipeline(Ridge(alpha=1.0)),
    "Random Forest": make_pipeline(RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1)),
    "Gradient Boosting": make_pipeline(GradientBoostingRegressor(n_estimators=300, learning_rate=0.05,
                                                                  max_depth=3, random_state=RANDOM_STATE)),
}

# baseline: always predict the training mean
baseline_pred = np.full(len(y_test), y_train.mean())
print("\n" + "=" * 70)
print("MODEL COMPARISON (predicting avg_salary in LPA)")
print("=" * 70)
print(f"{'Model':20s} {'MAE':>8s} {'RMSE':>8s} {'R2':>8s} {'CV R2':>8s}")
print(f"{'Baseline (mean)':20s} {mean_absolute_error(y_test, baseline_pred):8.2f} "
      f"{np.sqrt(mean_squared_error(y_test, baseline_pred)):8.2f} {r2_score(y_test, baseline_pred):8.3f} {'-':>8s}")

# ======================================================================
# 4. TRAIN + EVALUATE
# ======================================================================
results = {}
kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
for name, pipe in models.items():
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    rmse = np.sqrt(mean_squared_error(y_test, pred))
    r2 = r2_score(y_test, pred)
    cv = cross_val_score(pipe, X, y, cv=kf, scoring="r2").mean()
    results[name] = {"mae": mae, "rmse": rmse, "r2": r2, "cv": cv, "pred": pred}
    print(f"{name:20s} {mae:8.2f} {rmse:8.2f} {r2:8.3f} {cv:8.3f}")

best_name = max(results, key=lambda k: results[k]["cv"])
best_model = models[best_name]
print(f"\nBest model (by cross-validated R2): {best_name}")
print("MAE means: on average the prediction is off by that many LPA.")

# ---- plots: predicted vs actual ----
plt.figure(figsize=(6, 6))
plt.scatter(y_test, results[best_name]["pred"], alpha=0.5, color="#4C78A8")
lim = [0, max(y_test.max(), results[best_name]["pred"].max())]
plt.plot(lim, lim, "r--", label="Perfect prediction")
plt.xlabel("Actual avg salary (LPA)")
plt.ylabel("Predicted avg salary (LPA)")
plt.title(f"{best_name}: predicted vs actual")
plt.legend()
plt.grid(True)
save_plot("03_predicted_vs_actual.png")


from sklearn.inspection import permutation_importance
perm = permutation_importance(best_model, X_test, y_test, n_repeats=15, random_state=RANDOM_STATE, scoring="r2")
imp = pd.Series(perm.importances_mean, index=X_test.columns).sort_values()
print("\nFeature importance (drop in R2 when that input is shuffled; bigger = more important):")
print(imp.sort_values(ascending=False).round(3))
imp.plot.barh(color="#54A24B", figsize=(7, 4))
plt.title("Feature importance (permutation)")
save_plot("04_feature_importance.png")

best_model.fit(X, y)
joblib.dump(best_model, os.path.join(OUT_DIR, "salary_model.joblib"))
print(f"\nSaved model -> {OUT_DIR}/salary_model.joblib")


def predict_salary(company, job_title, min_experience, num_of_jobs=20):
    """Predict avg salary (LPA) for a job. Example: predict_salary('TCS','Data Scientist',2,300)"""
    row = pd.DataFrame([{
        "company_name": company,
        "job_title": job_title,
        "base_role": job_title.replace("Senior ", ""),
        "min_experience": min_experience,
        "num_of_jobs": num_of_jobs,
        "is_senior": int(job_title.startswith("Senior")),
    }])
    return float(best_model.predict(row)[0])


print("\nExample predictions:")
print("TCS, Data Scientist, 2 yrs      ->", round(predict_salary("TCS", "Data Scientist", 2, 300), 1), "LPA")
print("Microsoft Corporation, Senior Data Scientist, 5 yrs ->",
      round(predict_salary("Microsoft Corporation", "Senior Data Scientist", 5, 50), 1), "LPA")