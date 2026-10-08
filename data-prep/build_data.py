"""Cleans the 4 SAS hackathon files and writes insights.json + models.json for the backend.
Usage: python build_data.py "<folder with the 4 files>" <output folder>"""
import json, re, sys, collections
import numpy as np, pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
SRC, OUT = sys.argv[1], sys.argv[2]
ds = pd.read_csv(f'{SRC}/DataScience Jobs.csv'); an = pd.read_csv(f'{SRC}/Analytics Jobs.csv', encoding='latin-1')
j = pd.read_excel(f'{SRC}/JDS Skill Traits.xlsx'); s = pd.read_excel(f'{SRC}/SDS Personality Traits.xlsx'); s.columns = [c.strip() for c in s.columns]
dq = []
# ---- Data Science Jobs: "7.8L" strings -> numbers (lakhs)
def lakh(x): m = re.match(r'^\s*([\d.]+)\s*L', str(x)); return float(m.group(1)) if m else np.nan
for c in ['avg_salary', 'min_salary', 'max_salary']: ds[c] = ds[c].map(lakh)
bad = int(ds[['avg_salary', 'min_salary', 'max_salary']].isna().any(axis=1).sum()); ds = ds.dropna(subset=['avg_salary'])
q1, q3 = ds.avg_salary.quantile([.25, .75]); out_n = int((ds.avg_salary > q3 + 3 * (q3 - q1)).sum())
dq.append(f'Data Science Jobs: salaries stored as text ("7.8L") converted to numbers; {bad} unparseable rows dropped; {out_n} extreme salary outliers (>Q3+3*IQR) kept but reported with weighted averages.')
# ---- Analytics Jobs: dedupe, junk tokens, missing
n0 = len(an); an = an.drop_duplicates(subset=[c for c in an.columns if c != 's_no']); dq.append(f'Analytics Jobs: {n0 - len(an)} exact duplicate postings removed ({n0} -> {len(an)}).')
dq.append(f'Analytics Jobs: job_description missing in {an.job_description.isna().mean():.0%} and job_type in {an.job_type.isna().mean():.0%} of rows, so analysis relies on key_skills, location, salary band and designation.')
junk = {'...', '…', ''}
an['skills'] = an.key_skills.fillna('').str.lower().str.split(',').map(lambda l: {t.strip() for t in l} - junk)
dq.append(f'Analytics Jobs: placeholder skill tokens such as "..." dropped; {int((an.skills.map(len) == 0).sum())} postings have no usable skills.')
dq.append(f'JDS / SDS files: {int(j.isna().sum().sum() + s.isna().sum().sum())} missing values and {int(j.duplicated().sum() + s.duplicated().sum())} duplicates; scores on 1-5 (skills) and normalized (traits). Column name " extraversion" had a stray space (fixed).')
N = len(an); pct = lambda k: round(100 * k / N, 1)
DISP = {'sql': 'SQL', 'r': 'R', 'sas': 'SAS', 'nlp': 'NLP', 'bi': 'BI'}; disp = lambda t: DISP.get(t, t.title())
cnt = collections.Counter(t for sk in an.skills for t in sk)
WL = ['sql', 'python', 'r', 'sas', 'machine learning', 'data analysis', 'data analytics', 'excel', 'hadoop', 'spark', 'big data', 'data science', 'tableau', 'statistics', 'statistical modeling', 'data mining', 'deep learning', 'power bi', 'nlp', 'data visualization', 'business intelligence', 'predictive modeling']
top_skills = [{'name': disp(t), 'count': cnt[t], 'pct': pct(cnt[t])} for t in sorted([t for t in WL if cnt[t]], key=lambda t: -cnt[t])[:15]]
loc = collections.Counter(l.strip() for v in an.location for l in v.split(',') if l.strip())
locations = [{'name': k, 'count': v, 'pct': pct(v)} for k, v in loc.most_common(10)]
order = ['0to3', '3to6', '6to10', '10to15', '15to25', '25to50']; sc = an.salary.value_counts()
bands = [{'band': b.replace('to', '–') + 'L', 'count': int(sc.get(b, 0)), 'pct': pct(sc.get(b, 0))} for b in order]
ex = an.experience.str.extract(r'^(\d+)')[0].astype(float); eb = pd.cut(ex, [-1, 2, 5, 10, 99], labels=['0–2 yrs', '3–5 yrs', '6–10 yrs', '11+ yrs']).value_counts()
experience = [{'bucket': str(k), 'count': int(eb[k]), 'pct': pct(eb[k])} for k in ['0–2 yrs', '3–5 yrs', '6–10 yrs', '11+ yrs']]
desig = [{'name': k, 'count': int(v)} for k, v in an.job_desig.value_counts().head(10).items()]
w = lambda g: float(np.average(g.avg_salary, weights=g.num_of_jobs))
comp = ds.groupby('company_name').apply(lambda g: pd.Series({'jobs': int(g.num_of_jobs.sum()), 'avgSalaryL': round(w(g), 1)}), include_groups=False).sort_values('jobs', ascending=False).head(10)
companies = [{'name': k, 'jobs': int(r.jobs), 'avgSalaryL': r.avgSalaryL} for k, r in comp.iterrows()]
tt = ds.groupby('job_title').apply(lambda g: pd.Series({'postings': int(g.num_of_jobs.sum()), 'avgSalaryL': round(w(g), 1)}), include_groups=False).sort_values('postings', ascending=False)
titles = [{'title': k, 'postings': int(r.postings), 'avgSalaryL': r.avgSalaryL} for k, r in tt.iterrows()]
# ---- skill groups: market demand (jobs) vs junior proficiency (JDS) vs link to outcome
Y = 'salary_hike_high_or_low'
JF = [('bigData', 'big_data_skills', 'Big Data'), ('maths', 'maths-stats_skills', 'Maths & Stats'), ('coding', 'coding_skills', 'Coding'), ('aiml', 'ai_and_ml_skills', 'AI & ML'), ('dashboard', 'dashboard_and_storytelling_skills', 'Dashboards & Storytelling')]
KW = {'bigData': ['hadoop', 'spark', 'big data', 'hive', 'kafka', 'nosql', 'mongodb', 'hbase', 'mapreduce', 'pig'],
      'maths': ['statistics', 'statistical modeling', 'statistical analysis', 'regression', 'sas', 'r', 'spss', 'forecasting', 'predictive modeling', 'matlab'],
      'coding': ['python', 'sql', 'java', 'javascript', 'scala', 'c++', 'pl/sql', 'plsql'],
      'aiml': ['machine learning', 'deep learning', 'nlp', 'artificial intelligence', 'tensorflow', 'neural networks', 'data science', 'text mining'],
      'dashboard': ['tableau', 'power bi', 'qlikview', 'qlik sense', 'data visualization', 'dashboards', 'business intelligence', 'reporting', 'bi']}
cats = []
for key, col, label in JF:
    dem = round(100 * an.skills.map(lambda sk: bool(sk & set(KW[key]))).mean(), 1); mean = j[col].mean(); prof = round(mean / 5 * 100)
    cats.append({'key': key, 'name': label, 'demandPct': dem, 'cohortMean': round(mean, 2), 'proficiencyPct': prof, 'link': round(j[col].corr(j[Y]), 2), 'unmet': round(dem * (100 - prof) / 10)})
for i, c in enumerate(sorted(cats, key=lambda c: -c['unmet'])): c['risk'] = 'HIGH' if i < 2 else 'MEDIUM' if i < 4 else 'LOW'
# ---- models
def fit(df, feats, y, scale_hint):
    X = df[[c for _, c, _ in feats]]; yy = df[y]; pipe = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    cv = StratifiedKFold(5, shuffle=True, random_state=1)
    m = {'cvAccuracy': round(cross_val_score(pipe, X, yy, cv=cv).mean(), 3), 'cvAUC': round(cross_val_score(pipe, X, yy, cv=cv, scoring='roc_auc').mean(), 3), 'baseline': round(max(yy.mean(), 1 - yy.mean()), 3), 'n': len(df)}
    pipe.fit(X, yy); sc_, lr = pipe[0], pipe[1]; coef = lr.coef_[0] / sc_.scale_; b = float(lr.intercept_[0] - (coef * sc_.mean_).sum())
    rows = []
    for i, (k, c, lab) in enumerate(feats):
        rows.append({'key': k, 'label': lab, 'mean': round(float(df[c].mean()), 2), 'high': round(float(df[df[y] == 1][c].mean()), 2), 'low': round(float(df[df[y] == 0][c].mean()), 2), 'corr': round(float(df[c].corr(df[y])), 2),
                     'coef': float(coef[i]), 'std': round(float(lr.coef_[0][i]), 2)})
    return {'features': rows, 'intercept': b, 'metrics': m, 'outcomeRate': round(float(df[y].mean()), 3), 'min': scale_hint[0], 'max': scale_hint[1]}
SF = [('neuroticism', 'neuroticism', 'Neuroticism'), ('extraversion', 'extraversion', 'Extraversion'), ('openness', 'openness_to_experience', 'Openness'), ('agreeableness', 'agreeableness', 'Agreeableness'), ('conscientiousness', 'conscientiousness', 'Conscientiousness')]
SY = [c for c in s.columns if c.startswith('success')][0]
junior, senior = fit(j, JF, Y, (1, 5)), fit(s, SF, SY, (0, 100))
jb = sorted(junior['features'], key=lambda r: -abs(r['corr'])); sb = sorted(senior['features'], key=lambda r: -abs(r['corr']))
# ---- text facts for the chatbot, alerts and role call-outs
tl = ', '.join(f"{t['name']} ({t['pct']}%)" for t in top_skills[:8]); ll = ', '.join(f"{l['name']} ({l['pct']}%)" for l in locations[:6])
bl = ', '.join(f"{b['band']} {b['pct']}%" for b in bands); cl = ', '.join(f"{c['name']} ({c['jobs']} postings, avg {c['avgSalaryL']}L)" for c in companies[:6])
rl = '; '.join(f"{t['title']}: {t['postings']} postings, avg {t['avgSalaryL']}L" for t in titles)
jl = '; '.join(f"{r['label']}: high performers {r['high']} vs low {r['low']} (r={r['corr']})" for r in jb); sl = '; '.join(f"{r['label']}: successful {r['high']} vs not {r['low']} (r={r['corr']})" for r in sb)
facts = {'skills': f'Most requested data/analytics skills in {N} de-duplicated analytics postings: {tl}.', 'locations': f'Top job locations: {ll}.', 'salary': f'Salary bands of analytics postings (lakh/yr): {bl}. Data-science-jobs file average salaries by role: {rl}.',
         'companies': f'Companies with most postings (Data Science Jobs file): {cl}.', 'roles': f'Postings and average salary by role: {rl}. Most common analytics designations: ' + ', '.join(f"{d['name']} ({d['count']})" for d in desig[:5]) + '.',
         'experience': 'Minimum experience asked in analytics postings: ' + ', '.join(f"{e['bucket']} {e['pct']}%" for e in experience) + '.',
         'junior': f"Junior data scientists (n={junior['metrics']['n']}), {round(junior['outcomeRate'] * 100)}% got a high salary hike. Mean skill score of high vs low hike: {jl}. A logistic model predicts the hike with CV accuracy {junior['metrics']['cvAccuracy']} and AUC {junior['metrics']['cvAUC']}.",
         'senior': f"Senior customer-facing data scientists (n={senior['metrics']['n']}), {round(senior['outcomeRate'] * 100)}% classified high success. Mean traits successful vs not: {sl}. A logistic model predicts success with CV accuracy {senior['metrics']['cvAccuracy']} and AUC {senior['metrics']['cvAUC']}."}
top_c = max(cats, key=lambda c: c['unmet']); d0, d1, p0 = jb[0], jb[-1], sb[0]
alerts = [
 {'severity': 'CRITICAL', 'title': f"{top_c['name']} has the largest unmet-demand index", 'detail': f"Needed in {top_c['demandPct']}% of analytics postings while juniors average {top_c['cohortMean']}/5, so demand-weighted headroom is largest here (index {top_c['unmet']}).", 'actions': [f"Students: practise {top_c['name']}", f"Agencies: launch a {top_c['name']} course", f"Recruiters: test {top_c['name']} when screening"]},
 {'severity': 'WARNING', 'title': f"{d0['label']} separates high performers", 'detail': f"Juniors with high salary hikes score {d0['high']} vs {d0['low']} on {d0['label']} (r={d0['corr']}), the strongest link of all five skills.", 'actions': [f"Students: invest in {d0['label']}", 'Agencies: add projects that train it', 'Recruiters: weigh it in junior screening']},
 {'severity': 'WARNING', 'title': f"{p0['label']} and {sb[1]['label']} predict senior success", 'detail': f"Successful seniors average {p0['high']} vs {p0['low']} on {p0['label']} and {sb[1]['high']} vs {sb[1]['low']} on {sb[1]['label']}. Neuroticism shows almost no link (r={senior['features'][0]['corr']}).", 'actions': ['Recruiters: assess these traits for client-facing roles', 'Agencies: add soft-skill and ownership training', 'Students: build projects showing initiative']},
 {'severity': 'WATCH', 'title': f"{d1['label']} is the weakest predictor of salary hikes", 'detail': f"Only r={d1['corr']} with salary hikes (junior cohort mean {d1['mean']}/5), despite heavy demand for it in job postings.", 'actions': ['Students: do not neglect it, but prioritise stronger levers first', 'Agencies: pair it with practical projects']},
 {'severity': 'WATCH', 'title': f"{locations[0]['name']} dominates analytics hiring", 'detail': f"{locations[0]['pct']}% of postings mention {locations[0]['name']}, followed by {locations[1]['name']} ({locations[1]['pct']}%) and {locations[2]['name']} ({locations[2]['pct']}%).", 'actions': ['Students: target these hubs or remote roles', 'Recruiters: expect competition for talent there']},
 {'severity': 'WATCH', 'title': 'Most postings pay 10–25 lakh', 'detail': f"{bands[3]['pct']}% pay 10–15L and {bands[4]['pct']}% pay 15–25L; only {bands[5]['pct']}% pay 25L+.", 'actions': ['Students: senior-level skills unlock the 25L+ band', 'Recruiters: benchmark offers against these bands']}]
callouts = {'STUDENT': f"Learn {', '.join(t['name'] for t in top_skills[:3])} first: they appear most in postings. Then raise {d0['label']}, the strongest link to salary hikes among juniors.",
            'RECRUITER': f"Screen juniors on {d0['label']} and {jb[1]['label']}, and seniors on {p0['label']} and {sb[1]['label']}. Competition is highest in {locations[0]['name']}.",
            'COURSE_AGENCY': f"Teach {top_c['name']} first (gap index {top_c['unmet']}), build projects around {d0['label']}, and cover {', '.join(t['name'] for t in top_skills[:3])}."}
digest = ' '.join([facts[k] for k in ['skills', 'locations', 'salary', 'companies', 'junior', 'senior']] + ['Skill-group demand vs junior proficiency: ' + '; '.join(f"{c['name']}: in {c['demandPct']}% of postings, cohort {c['cohortMean']}/5" for c in cats) + '.'])
meta = {'analyticsRows': n0, 'analyticsClean': N, 'dsRows': int(len(ds)), 'companies': int(ds.company_name.nunique()), 'dsPostings': int(ds.num_of_jobs.sum()), 'juniors': len(j), 'seniors': len(s), 'dataQuality': dq}
json.dump({'meta': meta, 'topSkills': top_skills, 'categories': cats, 'locations': locations, 'salaryBands': bands, 'experience': experience, 'designations': desig, 'companies': companies, 'titles': titles,
           'junior': junior, 'senior': senior, 'facts': facts, 'digest': digest, 'alerts': alerts, 'callouts': callouts}, open(f'{OUT}/insights.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps(meta, indent=1)); print(len(digest), 'digest chars'); print(junior['metrics'], senior['metrics']); print([c['name'] + ':' + str(c['unmet']) for c in cats])
