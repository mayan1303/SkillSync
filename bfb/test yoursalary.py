#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Oct  7 19:01:12 2026

@author: aryanagnihotri
"""

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Career Advisor - "Where should I apply?"   (built for DataScience_Jobs.csv)

Run:    python job_advisor_app.py
Needs:  pandas   ->  pip install pandas      (tkinter comes with Python)

Dataset columns used:
    company_name, job_title, min_experience, avg_salary / min_salary / max_salary
    (like "7.8L" = 7.8 LPA), num_of_jobs

For each student the window shows:
    1. High-opportunity companies  (most openings)
    2. High-salary companies       (highest average LPA)
    3. Best fit for THIS student   (experience + expected salary + demand)
    4. Experience demand           (how many jobs ask for 0,1,2... years)
Every analysis is appended to student_reports.csv
"""

import os
import csv
import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import pandas as pd

JOBS_CSV = "DataScience_Jobs.csv"        # keep this file next to the script
REPORT_FILE = "student_reports.csv"
TOP_N = 10


def to_lpa(series):
    """'7.8L' -> 7.8   (also tolerates plain numbers)."""
    return pd.to_numeric(series.astype(str).str.replace(r"[^0-9.]", "", regex=True),
                         errors="coerce")


def load_jobs(path):
    df = pd.read_csv(path, encoding_errors="replace")
    df.columns = [c.strip().lower() for c in df.columns]
    needed = ["company_name", "job_title", "min_experience",
              "avg_salary", "min_salary", "max_salary", "num_of_jobs"]
    missing = [c for c in needed if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}\nFound: {list(df.columns)}")

    for c in ["avg_salary", "min_salary", "max_salary"]:
        df[c] = to_lpa(df[c])
    df["min_experience"] = pd.to_numeric(df["min_experience"], errors="coerce")
    df["num_of_jobs"] = pd.to_numeric(df["num_of_jobs"], errors="coerce")
    df["company_name"] = df["company_name"].astype(str).str.strip()
    df["job_title"] = df["job_title"].astype(str).str.strip()
    return df.dropna(subset=["company_name", "job_title", "num_of_jobs", "avg_salary"])



def role_filter(jobs, role):
    exact = jobs[jobs["job_title"].str.lower() == role.lower()]
    if not exact.empty:
        return exact                                   # e.g. "Data Scientist" only
    return jobs[jobs["job_title"].str.contains(role, case=False, regex=False)]


def company_table(df):
    """One row per company: total jobs, weighted avg / min / max salary."""
    def agg(g):
        w = g["num_of_jobs"]
        return pd.Series({
            "jobs": w.sum(),
            "avg_lpa": (g["avg_salary"] * w).sum() / w.sum(),
            "min_lpa": g["min_salary"].min(),
            "max_lpa": g["max_salary"].max(),
            "min_exp": g["min_experience"].min(),
        })
    return df.groupby("company_name").apply(agg, include_groups=False)


def analyse(jobs, role, experience, expected_lpa):
    market = role_filter(jobs, role)
    res = {"role": role, "total_jobs": 0}
    if market.empty:
        return res

    res["total_jobs"] = int(market["num_of_jobs"].sum())
    res["companies"] = market["company_name"].nunique()
    res["median_salary"] = round(market["avg_salary"].median(), 1)

    table = company_table(market)

    # 1. High opportunity
    res["demand"] = table.sort_values("jobs", ascending=False).head(TOP_N)

    # 2. High salary
    res["salary"] = table.sort_values("avg_lpa", ascending=False).head(TOP_N)

    # 3. Experience demand (share of jobs per min-experience level)
    exp = market.groupby("min_experience")["num_of_jobs"].sum().sort_index()
    res["exp_demand"] = exp
    total = exp.sum()
    res["share_eligible"] = round(exp[exp.index <= experience].sum() / total * 100, 1)
    res["typical_exp"] = float((exp.cumsum() / total >= 0.5).idxmax())

    # 4. Best fit for THIS student
    eligible = market[market["min_experience"] <= experience]
    res["eligible_jobs"] = int(eligible["num_of_jobs"].sum())
    if not eligible.empty:
        fit = company_table(eligible)
        o = fit["jobs"] / fit["jobs"].max()
        s = (fit["avg_lpa"] - fit["avg_lpa"].min()) / max(fit["avg_lpa"].max() - fit["avg_lpa"].min(), 1e-9)
        fit["score"] = 0.6 * o + 0.4 * s

        def verdict(r):
            if expected_lpa <= 0 or r["avg_lpa"] >= expected_lpa:
                return "Good fit"
            if r["max_lpa"] >= expected_lpa:
                return "Stretch (top of range)"
            return "Below expectation"
        fit["verdict"] = fit.apply(verdict, axis=1)
        order = {"Good fit": 0, "Stretch (top of range)": 1, "Below expectation": 2}
        fit["rank"] = fit["verdict"].map(order)
        res["best_fit"] = fit.sort_values(["rank", "score"], ascending=[True, False]).head(TOP_N)
        res["good_fit_count"] = int((fit["verdict"] == "Good fit").sum())
    return res


def build_summary(name, res, experience, expected_lpa):
    if res["total_jobs"] == 0:
        return f"No jobs found for '{res['role']}'. Pick a role from the dropdown."
    L = [f"Hi {name or 'Student'}! Market report for: {res['role']}", ""]
    L.append(f"* {res['total_jobs']:,} openings across {res['companies']} companies.")
    top_d = ", ".join(f"{c} ({int(r.jobs)})" for c, r in res["demand"].head(3).iterrows())
    L.append(f"* High demand: {top_d}")
    top_s = ", ".join(f"{c} (Rs {r.avg_lpa:.1f} LPA)" for c, r in res["salary"].head(3).iterrows())
    L.append(f"* Premium pay: {top_s}")
    L.append(f"* Median average salary in this role: Rs {res['median_salary']} LPA")
    L.append(f"* Half of all openings ask for {res['typical_exp']:.0f} year(s) of experience or less.")
    L.append(f"* With {experience:g} yr experience you qualify for {res['share_eligible']}% of openings "
             f"({res['eligible_jobs']:,} jobs).")
    if "best_fit" in res:
        n = res["good_fit_count"]
        if expected_lpa > 0:
            L.append(f"* {n} companies pay an average of Rs {expected_lpa:g} LPA or more and accept your experience.")
        best = res["best_fit"].head(3).index.tolist()
        L.append(f"* Best companies for you: {', '.join(best)}")
    else:
        L.append("* No openings accept your experience level yet - try internships or a junior role.")
    L += ["", f"For {res['role']}, some companies have high demand, while others offer premium compensation."]
    return "\n".join(L)


def save_report(name, role, experience, expected, res):
    new = not os.path.exists(REPORT_FILE)
    with open(REPORT_FILE, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["time", "name", "role", "experience", "expected_lpa",
                        "total_jobs", "eligible_jobs", "top_demand", "top_salary", "top_fit"])
        names = lambda k: "; ".join(res[k].head(3).index) if k in res else ""
        w.writerow([datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), name, role, experience,
                    expected, res.get("total_jobs", 0), res.get("eligible_jobs", 0),
                    names("demand"), names("salary"), names("best_fit")])


# ----------------------------------------------------------------------
# GUI
# ----------------------------------------------------------------------
class AdvisorApp:
    def __init__(self, root, jobs):
        self.root, self.jobs = root, jobs
        root.title("Career Advisor - Where should I apply?")
        root.geometry("1000x740")

        form = ttk.LabelFrame(root, text="Student details", padding=10)
        form.pack(fill="x", padx=10, pady=8)

        self.name = tk.StringVar()
        self.role = tk.StringVar()
        self.exp = tk.StringVar(value="0")
        self.salary = tk.StringVar(value="0")

        roles = jobs.groupby("job_title")["num_of_jobs"].sum().sort_values(ascending=False).index.tolist()

        ttk.Label(form, text="Name").grid(row=0, column=0, sticky="w")
        ttk.Entry(form, textvariable=self.name, width=24).grid(row=0, column=1, padx=6, pady=3)
        ttk.Label(form, text="Target role").grid(row=0, column=2, sticky="w")
        ttk.Combobox(form, textvariable=self.role, values=roles, width=30,
                     state="readonly").grid(row=0, column=3, padx=6)
        ttk.Label(form, text="Experience (years)").grid(row=1, column=0, sticky="w")
        ttk.Entry(form, textvariable=self.exp, width=24).grid(row=1, column=1, padx=6, pady=3)
        ttk.Label(form, text="Expected salary (LPA)").grid(row=1, column=2, sticky="w")
        ttk.Entry(form, textvariable=self.salary, width=32).grid(row=1, column=3, padx=6)

        btns = ttk.Frame(form)
        btns.grid(row=2, column=0, columnspan=4, sticky="e", pady=(6, 0))
        ttk.Button(btns, text="Analyse", command=self.run).pack(side="left", padx=4)
        ttk.Button(btns, text="New student", command=self.clear).pack(side="left", padx=4)
        ttk.Button(btns, text="Load other CSV", command=self.reload).pack(side="left", padx=4)

        self.summary = tk.Text(root, height=12, wrap="word", font=("Segoe UI", 10))
        self.summary.pack(fill="x", padx=10)

        self.tabs = ttk.Notebook(root)
        self.tabs.pack(fill="both", expand=True, padx=10, pady=8)
        self.tables = {}
        specs = {
            "High Opportunity": ("Company", "Jobs", "Avg LPA"),
            "High Salary": ("Company", "Avg LPA", "Salary range (LPA)", "Jobs"),
            "Best Fit For You": ("Company", "Verdict", "Avg LPA", "Jobs", "Min exp (yrs)"),
            "Experience Demand": ("Min experience (yrs)", "Jobs", "Share of jobs"),
        }
        for title, heads in specs.items():
            frame = ttk.Frame(self.tabs)
            tree = ttk.Treeview(frame, columns=heads, show="headings", height=9)
            for h in heads:
                tree.heading(h, text=h)
                tree.column(h, width=170, anchor="w")
            tree.pack(fill="both", expand=True)
            self.tabs.add(frame, text=title)
            self.tables[title] = tree

        self.status = ttk.Label(root, relief="sunken", anchor="w")
        self.status.pack(fill="x", side="bottom")
        self.set_status()

    def set_status(self):
        self.status.config(text=f" {len(self.jobs)} rows | {self.jobs['company_name'].nunique()} companies | "
                                f"{int(self.jobs['num_of_jobs'].sum()):,} total openings")

    def clear(self):
        self.name.set(""); self.role.set(""); self.exp.set("0"); self.salary.set("0")
        self.summary.delete("1.0", "end")
        for t in self.tables.values():
            t.delete(*t.get_children())

    def reload(self):
        path = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])
        if path:
            try:
                self.jobs = load_jobs(path)
                self.set_status()
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def run(self):
        role = self.role.get().strip()
        if not role:
            messagebox.showwarning("Missing input", "Please choose a target role.")
            return
        try:
            experience = float(self.exp.get() or 0)
            expected = float(self.salary.get() or 0)
            if experience < 0 or expected < 0:
                raise ValueError
        except ValueError:
            messagebox.showwarning("Invalid input", "Experience and salary must be positive numbers.")
            return

        name = self.name.get().strip()
        res = analyse(self.jobs, role, experience, expected)
        self.summary.delete("1.0", "end")
        self.summary.insert("end", build_summary(name, res, experience, expected))
        for t in self.tables.values():
            t.delete(*t.get_children())
        if res["total_jobs"] == 0:
            return

        for c, r in res["demand"].iterrows():
            self.tables["High Opportunity"].insert("", "end", values=(c, int(r.jobs), f"Rs {r.avg_lpa:.1f}"))
        for c, r in res["salary"].iterrows():
            self.tables["High Salary"].insert("", "end", values=(
                c, f"Rs {r.avg_lpa:.1f}", f"{r.min_lpa:.1f} - {r.max_lpa:.1f}", int(r.jobs)))
        if "best_fit" in res:
            for c, r in res["best_fit"].iterrows():
                self.tables["Best Fit For You"].insert("", "end", values=(
                    c, r.verdict, f"Rs {r.avg_lpa:.1f}", int(r.jobs), int(r.min_exp)))
        total = res["exp_demand"].sum()
        for e, n in res["exp_demand"].items():
            pct = n / total * 100
            self.tables["Experience Demand"].insert("", "end", values=(
                int(e), int(n), f"{pct:.1f}%  " + "#" * int(pct / 2)))

        save_report(name, role, experience, expected, res)


def main():
    root = tk.Tk()
    path = JOBS_CSV
    if not os.path.exists(path):
        messagebox.showinfo("Select dataset", "Please select DataScience_Jobs.csv")
        path = filedialog.askopenfilename(title="Select jobs dataset", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
    try:
        jobs = load_jobs(path)
    except Exception as e:
        messagebox.showerror("Error loading dataset", str(e))
        return
    AdvisorApp(root, jobs)
    root.mainloop()


if __name__ == "__main__":
    main()