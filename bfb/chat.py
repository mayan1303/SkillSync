#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Oct  7 21:15:11 2026

@author: aryanagnihotri
"""

import os
import re
import json
import math
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
import numpy as np



JDS_PATH = "/Users/aryanagnihotri/Documents/JDS Skill Traits.csv"
JOBS_PATH = "/Users/aryanagnihotri/Documents/DataScience Jobs.csv"
PERSONALITY_PATH = "/Users/aryanagnihotri/Documents/SDS Personality Traits.csv"

BASE_DIR = "/Users/aryanagnihotri/Documents"
USERS_PATH = os.path.join(BASE_DIR, "skill_connect_users.csv")
REQUESTS_PATH = os.path.join(BASE_DIR, "skill_connect_requests.csv")



def load_csv(path):
    try:
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()
    except Exception as e:
        print("Error loading:", path, e)
        return pd.DataFrame()


jds_df = load_csv(JDS_PATH)
jobs_df = load_csv(JOBS_PATH)
personality_df = load_csv(PERSONALITY_PATH)



def clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_skill(skill):
    skill = clean_text(skill).lower()
    skill = skill.replace("&", "and")
    skill = re.sub(r"[^a-z0-9+#.\- ]", " ", skill)
    skill = re.sub(r"\s+", " ", skill)
    return skill.strip()


def split_skills(text):
    if not text:
        return []

    text = str(text)

    parts = re.split(r",|;|\||/|\n|•|·", text)

    result = []

    for p in parts:
        p = normalize_skill(p)

        if p and len(p) > 1:
            result.append(p)

    return list(dict.fromkeys(result))


def find_column(df, keywords):
    if df.empty:
        return None

    cols = list(df.columns)

    for col in cols:
        c = str(col).lower()

        for keyword in keywords:
            if keyword in c:
                return col

    return None


def get_numeric(value):
    try:
        if pd.isna(value):
            return 0.0

        text = str(value)

        nums = re.findall(r"\d+(?:\.\d+)?", text)

        if nums:
            return float(nums[0])

    except:
        pass

    return 0.0



def detect_skill_columns(df):

    if df.empty:
        return []

    possible = []

    keywords = [
        "skill",
        "skills",
        "technology",
        "technologies",
        "tools",
        "competenc",
        "expertise",
        "requirement",
        "knowledge"
    ]

    for col in df.columns:

        name = str(col).lower()

        if any(k in name for k in keywords):
            possible.append(col)

    return possible


JDS_SKILL_COLUMNS = detect_skill_columns(jds_df)
JOB_SKILL_COLUMNS = detect_skill_columns(jobs_df)



def extract_market_skills():

    skills = {}

    for df, columns in [
        (jds_df, JDS_SKILL_COLUMNS),
        (jobs_df, JOB_SKILL_COLUMNS)
    ]:

        for col in columns:

            if col not in df.columns:
                continue

            for value in df[col].dropna():

                for skill in split_skills(value):

                    skills[skill] = skills.get(skill, 0) + 1

    return skills


MARKET_SKILLS = extract_market_skills()



USER_COLUMNS = [
    "user_id",
    "name",
    "current_skills",
    "learning_skills",
    "skill_levels",
    "career_goal",
    "bio",
    "can_teach",
    "private_chat",
    "public_reply",
    "neuroticism",
    "extraversion",
    "openness",
    "agreeableness",
    "conscientiousness"
]


def load_users():

    if os.path.exists(USERS_PATH):

        try:
            df = pd.read_csv(USERS_PATH)

            for col in USER_COLUMNS:
                if col not in df.columns:
                    df[col] = ""

            return df[USER_COLUMNS]

        except Exception as e:
            print(e)

    return pd.DataFrame(columns=USER_COLUMNS)


users_df = load_users()


def save_users():

    users_df.to_csv(
        USERS_PATH,
        index=False
    )


def save_requests(df):

    df.to_csv(
        REQUESTS_PATH,
        index=False
    )


def get_personality(index):

    if personality_df.empty:
        return {
            "neuroticism": 0.5,
            "extraversion": 0.5,
            "openness": 0.5,
            "agreeableness": 0.5,
            "conscientiousness": 0.5
        }

    row = personality_df.iloc[index % len(personality_df)]

    return {
        "neuroticism": get_numeric(row.get("neuroticism", 0.5)),
        "extraversion": get_numeric(row.get("extraversion", 0.5)),
        "openness": get_numeric(row.get("openness_to_experience", 0.5)),
        "agreeableness": get_numeric(row.get("agreeableness", 0.5)),
        "conscientiousness": get_numeric(row.get("conscientiousness", 0.5))
    }


def create_demo_users():

    global users_df

    demo_users = [
        {
            "user_id": "U001",
            "name": "Rahul",
            "current_skills": "Python, Machine Learning, Pandas",
            "learning_skills": "Computer Vision, Deep Learning",
            "skill_levels": "Python:4, Machine Learning:3, Pandas:4",
            "career_goal": "AI Engineer",
            "bio": "Interested in practical AI and computer vision.",
            "can_teach": "Python, Pandas",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U002",
            "name": "Priya",
            "current_skills": "Python, Computer Vision, OpenCV, Deep Learning",
            "learning_skills": "MLOps, Cloud",
            "skill_levels": "Python:5, Computer Vision:5, OpenCV:5, Deep Learning:4",
            "career_goal": "Computer Vision Engineer",
            "bio": "Computer vision enthusiast.",
            "can_teach": "Computer Vision, OpenCV, Deep Learning",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U003",
            "name": "Aditya",
            "current_skills": "Java, Spring Boot, SQL",
            "learning_skills": "Python, Machine Learning",
            "skill_levels": "Java:5, Spring Boot:4, SQL:4",
            "career_goal": "Software Engineer",
            "bio": "Backend developer looking to enter AI.",
            "can_teach": "Java, SQL",
            "private_chat": 1,
            "public_reply": 0
        },
        {
            "user_id": "U004",
            "name": "Neha",
            "current_skills": "Python, Statistics, Machine Learning, SQL",
            "learning_skills": "Deep Learning, NLP",
            "skill_levels": "Python:4, Statistics:5, Machine Learning:4, SQL:4",
            "career_goal": "Data Scientist",
            "bio": "Interested in data science and ML.",
            "can_teach": "Statistics, Machine Learning, SQL",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U005",
            "name": "Arjun",
            "current_skills": "Python, TensorFlow, Deep Learning, CNN",
            "learning_skills": "Computer Vision, OpenCV",
            "skill_levels": "Python:5, TensorFlow:4, Deep Learning:4, CNN:4",
            "career_goal": "Machine Learning Engineer",
            "bio": "Interested in deep learning and practical AI systems.",
            "can_teach": "Python, TensorFlow, Deep Learning, CNN",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U006",
            "name": "Simran",
            "current_skills": "Python, Pandas, NumPy, Statistics, SQL",
            "learning_skills": "Machine Learning, Deep Learning",
            "skill_levels": "Python:4, Pandas:5, NumPy:4, Statistics:5, SQL:4",
            "career_goal": "Data Scientist",
            "bio": "Data science learner focused on analytics and statistics.",
            "can_teach": "Pandas, NumPy, Statistics, SQL",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U007",
            "name": "Karan",
            "current_skills": "Java, Spring Boot, REST API, MySQL, Docker",
            "learning_skills": "AWS, Kubernetes, DevOps",
            "skill_levels": "Java:5, Spring Boot:5, REST API:4, MySQL:4, Docker:4",
            "career_goal": "Backend Engineer",
            "bio": "Backend developer interested in scalable systems.",
            "can_teach": "Java, Spring Boot, REST API, MySQL",
            "private_chat": 1,
            "public_reply": 0
        },
        {
            "user_id": "U008",
            "name": "Ananya",
            "current_skills": "JavaScript, React, HTML, CSS, Node.js",
            "learning_skills": "TypeScript, Next.js, UI UX",
            "skill_levels": "JavaScript:5, React:5, HTML:5, CSS:4, Node.js:4",
            "career_goal": "Frontend Engineer",
            "bio": "Frontend developer who enjoys building user-focused applications.",
            "can_teach": "JavaScript, React, HTML, CSS, Node.js",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U009",
            "name": "Vikram",
            "current_skills": "Python, NLP, Transformers, Hugging Face, Machine Learning",
            "learning_skills": "LLMs, Generative AI, RAG",
            "skill_levels": "Python:5, NLP:5, Transformers:4, Hugging Face:4, Machine Learning:4",
            "career_goal": "NLP Engineer",
            "bio": "Working on NLP and modern language models.",
            "can_teach": "Python, NLP, Transformers, Hugging Face",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U010",
            "name": "Mehak",
            "current_skills": "SQL, Excel, Power BI, Tableau, Statistics",
            "learning_skills": "Python, Data Science, Machine Learning",
            "skill_levels": "SQL:5, Excel:5, Power BI:5, Tableau:4, Statistics:4",
            "career_goal": "Data Analyst",
            "bio": "Analytics enthusiast interested in turning data into decisions.",
            "can_teach": "SQL, Excel, Power BI, Tableau, Statistics",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U011",
            "name": "Rohan",
            "current_skills": "C++, Data Structures, Algorithms, Competitive Programming",
            "learning_skills": "Machine Learning, Python",
            "skill_levels": "C++:5, Data Structures:5, Algorithms:5, Competitive Programming:5",
            "career_goal": "Software Engineer",
            "bio": "Competitive programmer interested in moving toward AI.",
            "can_teach": "C++, Data Structures, Algorithms, Competitive Programming",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U012",
            "name": "Ishita",
            "current_skills": "Python, AWS, Docker, Kubernetes, Linux",
            "learning_skills": "MLOps, Machine Learning",
            "skill_levels": "Python:4, AWS:5, Docker:5, Kubernetes:4, Linux:5",
            "career_goal": "Cloud Engineer",
            "bio": "Cloud and DevOps enthusiast exploring machine learning systems.",
            "can_teach": "AWS, Docker, Kubernetes, Linux",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U013",
            "name": "Dev",
            "current_skills": "Python, OpenCV, Computer Vision, YOLO, Image Processing",
            "learning_skills": "Robotics, ROS, Reinforcement Learning",
            "skill_levels": "Python:5, OpenCV:5, Computer Vision:5, YOLO:4, Image Processing:5",
            "career_goal": "Computer Vision Engineer",
            "bio": "Computer vision developer interested in autonomous robotics.",
            "can_teach": "Python, OpenCV, Computer Vision, YOLO, Image Processing",
            "private_chat": 1,
            "public_reply": 1
        },
        {
            "user_id": "U014",
            "name": "Aditi",
            "current_skills": "Python, Machine Learning, Scikit Learn, Pandas, Matplotlib",
            "learning_skills": "Deep Learning, Computer Vision, NLP",
            "skill_levels": "Python:5, Machine Learning:4, Scikit Learn:5, Pandas:5, Matplotlib:4",
            "career_goal": "AI Engineer",
            "bio": "AI learner building end-to-end machine learning projects.",
            "can_teach": "Python, Machine Learning, Scikit Learn, Pandas, Matplotlib",
            "private_chat": 1,
            "public_reply": 1
        }
    ]

    existing_ids = set(
        users_df["user_id"].astype(str)
    )

    new_users = []

    for i, user in enumerate(demo_users):

        if user["user_id"] in existing_ids:
            continue

        p = get_personality(i)

        user.update(p)

        new_users.append(user)

    if new_users:

        new_df = pd.DataFrame(new_users)

        for col in USER_COLUMNS:

            if col not in new_df.columns:
                new_df[col] = ""

        new_df = new_df[USER_COLUMNS]

        users_df = pd.concat(
            [users_df, new_df],
            ignore_index=True
        )

        save_users()

    print("Total users loaded:", len(users_df))
create_demo_users()



def parse_user_skills(text):

    return set(
        normalize_skill(x)
        for x in split_skills(text)
        if normalize_skill(x)
    )


def parse_skill_levels(text):

    result = {}

    if not text:
        return result

    parts = re.split(r",|;", str(text))

    for part in parts:

        if ":" in part:

            skill, level = part.split(":", 1)

            skill = normalize_skill(skill)

            try:
                level = float(level)
            except:
                level = 3

            result[skill] = max(
                1,
                min(5, level)
            )

    return result




def calculate_skill_match(current_skills,
                          desired_skills,
                          other_user):

    other_current = parse_user_skills(
        other_user.get("current_skills", "")
    )

    other_teach = parse_user_skills(
        other_user.get("can_teach", "")
    )

    target = desired_skills

    if len(target) == 0:
        return 0, [], []

    teaching_pool = other_current | other_teach

    matched = target.intersection(teaching_pool)

    missing = target - teaching_pool

    score = (
        len(matched) /
        max(1, len(target))
    ) * 100

    return score, list(matched), list(missing)



def career_score(goal1, goal2):

    goal1 = normalize_skill(goal1)
    goal2 = normalize_skill(goal2)

    if not goal1 or not goal2:
        return 50

    if goal1 == goal2:
        return 100

    words1 = set(goal1.split())
    words2 = set(goal2.split())

    intersection = words1.intersection(words2)

    if intersection:
        return 70

    return 30



def personality_score(user_a, user_b):

    fields = [
        "neuroticism",
        "extraversion",
        "openness",
        "agreeableness",
        "conscientiousness"
    ]

    values = []

    for field in fields:

        try:

            a = float(user_a.get(field, 0.5))
            b = float(user_b.get(field, 0.5))

            difference = abs(a - b)

            similarity = max(
                0,
                1 - difference
            )

            values.append(similarity)

        except:
            pass

    if not values:
        return 50

    return np.mean(values) * 100



def level_score(desired_skills, other_user):

    levels = parse_skill_levels(
        other_user.get("skill_levels", "")
    )

    if not desired_skills:
        return 50

    values = []

    for skill in desired_skills:

        if skill in levels:

            level = levels[skill]

            values.append(
                min(level / 5, 1)
            )

    if not values:
        return 30

    return np.mean(values) * 100



def calculate_match(user_a, user_b):

    current_a = parse_user_skills(
        user_a.get("current_skills", "")
    )

    desired_a = parse_user_skills(
        user_a.get("learning_skills", "")
    )

    skill_score, matched, missing = calculate_skill_match(
        current_a,
        desired_a,
        user_b
    )

    career = career_score(
        user_a.get("career_goal", ""),
        user_b.get("career_goal", "")
    )

    personality = personality_score(
        user_a,
        user_b
    )

    levels = level_score(
        desired_a,
        user_b
    )

    # Hybrid scoring
    final_score = (
        0.45 * skill_score +
        0.20 * levels +
        0.20 * career +
        0.15 * personality
    )

    return {
        "score": round(final_score, 2),
        "skill_score": round(skill_score, 2),
        "career_score": round(career, 2),
        "personality_score": round(personality, 2),
        "level_score": round(levels, 2),
        "matched": matched,
        "missing": missing
    }



def policy_allowed(user):

    try:
        private_allowed = int(
            user.get("private_chat", 0)
        ) == 1

    except:
        private_allowed = False

    try:
        public_allowed = int(
            user.get("public_reply", 0)
        ) == 1

    except:
        public_allowed = False

    return private_allowed, public_allowed



class SkillConnectApp:

    def __init__(self, root):

        self.root = root

        self.root.title(
            "SkillConnect AI - Career Intelligence"
        )

        self.root.geometry(
            "1200x750"
        )

        self.root.minsize(
            1000,
            650
        )

        self.current_user = None

        self.setup_style()

        self.build_header()

        self.build_tabs()

        self.refresh_user_dropdown()

    # --------------------------------------------------------

    def setup_style(self):

        style = ttk.Style()

        try:
            style.theme_use("clam")
        except:
            pass

        style.configure(
            "Title.TLabel",
            font=("Arial", 22, "bold")
        )

        style.configure(
            "Heading.TLabel",
            font=("Arial", 14, "bold")
        )

        style.configure(
            "Main.TButton",
            font=("Arial", 11, "bold"),
            padding=8
        )

        style.configure(
            "Treeview",
            rowheight=30,
            font=("Arial", 10)
        )

    # --------------------------------------------------------

    def build_header(self):

        header = ttk.Frame(self.root)

        header.pack(
            fill="x",
            padx=20,
            pady=15
        )

        ttk.Label(
            header,
            text="SkillConnect AI",
            style="Title.TLabel"
        ).pack(
            side="left"
        )

        ttk.Label(
            header,
            text="Skill → People → Learning → Career",
            font=("Arial", 11)
        ).pack(
            side="right"
        )

    # --------------------------------------------------------

    def build_tabs(self):

        notebook = ttk.Notebook(
            self.root
        )

        notebook.pack(
            fill="both",
            expand=True,
            padx=15,
            pady=5
        )

        self.dashboard_tab = ttk.Frame(
            notebook
        )

        self.match_tab = ttk.Frame(
            notebook
        )

        self.request_tab = ttk.Frame(
            notebook
        )

        self.add_user_tab = ttk.Frame(
            notebook
        )

        notebook.add(
            self.dashboard_tab,
            text="Dashboard"
        )

        notebook.add(
            self.match_tab,
            text="Find Skill Matches"
        )

        notebook.add(
            self.request_tab,
            text="Skill Requests"
        )

        notebook.add(
            self.add_user_tab,
            text="Add User"
        )

        self.build_dashboard()
        self.build_match()
        self.build_requests()
        self.build_add_user()

    # --------------------------------------------------------

    def build_dashboard(self):

        frame = self.dashboard_tab

        ttk.Label(
            frame,
            text="Your Career Intelligence Dashboard",
            style="Heading.TLabel"
        ).pack(
            anchor="w",
            padx=25,
            pady=20
        )

        stats = ttk.Frame(frame)

        stats.pack(
            fill="x",
            padx=25
        )

        self.users_label = ttk.Label(
            stats,
            text="Users: 0",
            font=("Arial", 14)
        )

        self.users_label.pack(
            side="left",
            padx=20
        )

        self.skills_label = ttk.Label(
            stats,
            text="Market Skills: 0",
            font=("Arial", 14)
        )

        self.skills_label.pack(
            side="left",
            padx=20
        )

        self.jobs_label = ttk.Label(
            stats,
            text="Job Records: 0",
            font=("Arial", 14)
        )

        self.jobs_label.pack(
            side="left",
            padx=20
        )

        self.update_dashboard()

        explanation = """
HOW THE SYSTEM WORKS

1. User tells the system what skills they already have.
2. User specifies the skill they want to learn.
3. The system searches other users who can teach that skill.
4. Skill level, career goal and personality compatibility are calculated.
5. Privacy preferences are checked before communication.
6. The user can request a private connection or interact through
   a public skill request when the other user allows it.

The matching engine combines:
• Skill Complementarity
• Skill Level
• Career Compatibility
• Personality Compatibility
• User Privacy Preferences
"""

        ttk.Label(
            frame,
            text=explanation,
            justify="left",
            font=("Arial", 11)
        ).pack(
            anchor="w",
            padx=45,
            pady=30
        )

    # --------------------------------------------------------

    def update_dashboard(self):

        self.users_label.config(
            text=f"Users: {len(users_df)}"
        )

        self.skills_label.config(
            text=f"Market Skills: {len(MARKET_SKILLS)}"
        )

        self.jobs_label.config(
            text=f"Job Records: {len(jobs_df)}"
        )

    # --------------------------------------------------------

    def build_match(self):

        frame = self.match_tab

        top = ttk.Frame(frame)

        top.pack(
            fill="x",
            padx=20,
            pady=15
        )

        ttk.Label(
            top,
            text="Select User:"
        ).grid(
            row=0,
            column=0,
            padx=5
        )

        self.user_var = tk.StringVar()

        self.user_combo = ttk.Combobox(
            top,
            textvariable=self.user_var,
            width=35,
            state="readonly"
        )

        self.user_combo.grid(
            row=0,
            column=1,
            padx=10
        )

        ttk.Button(
            top,
            text="Find Best Matches",
            style="Main.TButton",
            command=self.find_matches
        ).grid(
            row=0,
            column=2,
            padx=10
        )

        self.match_tree = ttk.Treeview(
            frame,
            columns=(
                "name",
                "score",
                "skills",
                "career",
                "personality",
                "level",
                "private"
            ),
            show="headings"
        )

        headings = {
            "name": "User",
            "score": "Match %",
            "skills": "Skill Match %",
            "career": "Career %",
            "personality": "Personality %",
            "level": "Skill Level %",
            "private": "Private Chat"
        }

        for col, heading in headings.items():

            self.match_tree.heading(
                col,
                text=heading
            )

            self.match_tree.column(
                col,
                width=140
            )

        self.match_tree.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=10
        )

        self.match_tree.bind(
            "<Double-1>",
            self.open_selected_user
        )

        self.match_info = tk.Text(
            frame,
            height=8,
            font=("Arial", 10)
        )

        self.match_info.pack(
            fill="x",
            padx=20,
            pady=10
        )

    # --------------------------------------------------------

    def refresh_user_dropdown(self):

        values = []

        for _, row in users_df.iterrows():

            values.append(
                f"{row['user_id']} - {row['name']}"
            )

        self.user_combo["values"] = values

        if values:
            self.user_combo.current(0)

    # --------------------------------------------------------

    def find_matches(self):

        selection = self.user_var.get()

        if not selection:
            messagebox.showwarning(
                "Select User",
                "Please select a user."
            )
            return

        user_id = selection.split(" - ")[0]

        selected_rows = users_df[
            users_df["user_id"].astype(str) == user_id
        ]

        if selected_rows.empty:
            return

        user = selected_rows.iloc[0]

        self.current_user = user

        for item in self.match_tree.get_children():

            self.match_tree.delete(item)

        results = []

        for _, other in users_df.iterrows():

            if str(other["user_id"]) == str(
                user["user_id"]
            ):
                continue

            private_allowed, public_allowed = policy_allowed(
                other
            )

            match = calculate_match(
                user,
                other
            )

            if match["score"] < 20:
                continue

            results.append(
                (
                    match["score"],
                    other,
                    match,
                    private_allowed,
                    public_allowed
                )
            )

        results.sort(
            key=lambda x: x[0],
            reverse=True
        )

        for score, other, match, private, public in results[:10]:

            private_text = (
                "Allowed"
                if private
                else "Not allowed"
            )

            self.match_tree.insert(
                "",
                "end",
                iid=str(other["user_id"]),
                values=(
                    other["name"],
                    f"{score}%",
                    f"{match['skill_score']}%",
                    f"{match['career_score']}%",
                    f"{match['personality_score']}%",
                    f"{match['level_score']}%",
                    private_text
                )
            )

        self.match_info.delete(
            "1.0",
            "end"
        )

        self.match_info.insert(
            "end",
            f"Showing best compatible users for "
            f"{user['name']}.\n\n"
            "Double-click a user to view the detailed "
            "skill connection recommendation."
        )

    # --------------------------------------------------------

    def open_selected_user(self, event):

        selected = self.match_tree.selection()

        if not selected:
            return

        user_id = selected[0]

        rows = users_df[
            users_df["user_id"].astype(str) == str(user_id)
        ]

        if rows.empty:
            return

        other = rows.iloc[0]

        if self.current_user is None:
            return

        match = calculate_match(
            self.current_user,
            other
        )

        private, public = policy_allowed(
            other
        )

        self.match_info.delete(
            "1.0",
            "end"
        )

        text = f"""
USER: {other['name']}

OVERALL COMPATIBILITY: {match['score']}%

SKILL MATCH: {match['skill_score']}%
SKILL LEVEL: {match['level_score']}%
CAREER COMPATIBILITY: {match['career_score']}%
PERSONALITY COMPATIBILITY: {match['personality_score']}%

SKILLS THEY CAN HELP WITH:
{', '.join(match['matched']) if match['matched'] else 'No direct skill overlap found'}

CAREER:
{other['career_goal']}

BIO:
{other['bio']}

PRIVATE CHAT:
{'Available' if private else 'Not available'}

PUBLIC REPLIES:
{'Available' if public else 'Not available'}
"""

        self.match_info.insert(
            "end",
            text
        )

    # --------------------------------------------------------

    def build_requests(self):

        frame = self.request_tab

        ttk.Label(
            frame,
            text="Create a Public Skill Request",
            style="Heading.TLabel"
        ).pack(
            anchor="w",
            padx=25,
            pady=20
        )

        form = ttk.Frame(frame)

        form.pack(
            fill="x",
            padx=25
        )

        ttk.Label(
            form,
            text="User:"
        ).grid(
            row=0,
            column=0,
            sticky="w",
            pady=8
        )

        self.request_user = ttk.Combobox(
            form,
            width=35,
            state="readonly"
        )

        self.request_user.grid(
            row=0,
            column=1,
            padx=10
        )

        ttk.Label(
            form,
            text="Skill you want to learn:"
        ).grid(
            row=1,
            column=0,
            sticky="w",
            pady=8
        )

        self.request_skill = ttk.Entry(
            form,
            width=40
        )

        self.request_skill.grid(
            row=1,
            column=1,
            padx=10
        )

        ttk.Label(
            form,
            text="Message:"
        ).grid(
            row=2,
            column=0,
            sticky="nw",
            pady=8
        )

        self.request_message = tk.Text(
            form,
            width=45,
            height=6
        )

        self.request_message.grid(
            row=2,
            column=1,
            padx=10
        )

        ttk.Button(
            form,
            text="Post Skill Request",
            style="Main.TButton",
            command=self.create_request
        ).grid(
            row=3,
            column=1,
            sticky="w",
            pady=15
        )

        self.request_output = tk.Text(
            frame,
            height=15,
            font=("Arial", 10)
        )

        self.request_output.pack(
            fill="both",
            expand=True,
            padx=25,
            pady=10
        )

        self.refresh_request_users()

    # --------------------------------------------------------

    def refresh_request_users(self):

        values = []

        for _, row in users_df.iterrows():

            values.append(
                f"{row['user_id']} - {row['name']}"
            )

        self.request_user["values"] = values

        if values:
            self.request_user.current(0)

    # --------------------------------------------------------

    def create_request(self):

        selection = self.request_user.get()

        skill = normalize_skill(
            self.request_skill.get()
        )

        message = self.request_message.get(
            "1.0",
            "end"
        ).strip()

        if not selection or not skill:

            messagebox.showwarning(
                "Missing Information",
                "Select a user and enter a skill."
            )

            return

        user_id = selection.split(" - ")[0]

        new_request = pd.DataFrame(
            [{
                "user_id": user_id,
                "skill": skill,
                "message": message,
                "status": "OPEN"
            }]
        )

        if os.path.exists(REQUESTS_PATH):

            old = pd.read_csv(
                REQUESTS_PATH
            )

            new_request = pd.concat(
                [old, new_request],
                ignore_index=True
            )

        save_requests(
            new_request
        )

        self.request_output.delete(
            "1.0",
            "end"
        )

        self.request_output.insert(
            "end",
            f"""
PUBLIC SKILL REQUEST CREATED

Skill:
{skill}

Message:
{message}

The system can now identify users who:
• possess this skill
• have sufficient skill level
• allow public replies
• satisfy compatibility requirements
"""
        )

        messagebox.showinfo(
            "Success",
            "Skill request created."
        )

    # --------------------------------------------------------

    def build_add_user(self):

        frame = self.add_user_tab

        ttk.Label(
            frame,
            text="Create User Profile",
            style="Heading.TLabel"
        ).pack(
            anchor="w",
            padx=25,
            pady=20
        )

        form = ttk.Frame(frame)

        form.pack(
            padx=25,
            anchor="w"
        )

        self.add_entries = {}

        fields = [
            ("User ID", "user_id"),
            ("Name", "name"),
            ("Current Skills", "current_skills"),
            ("Skills You Want To Learn", "learning_skills"),
            ("Skill Levels", "skill_levels"),
            ("Career Goal", "career_goal"),
            ("Bio", "bio"),
            ("Skills You Can Teach", "can_teach")
        ]

        for i, (label, key) in enumerate(fields):

            ttk.Label(
                form,
                text=label
            ).grid(
                row=i,
                column=0,
                sticky="w",
                pady=7
            )

            entry = ttk.Entry(
                form,
                width=60
            )

            entry.grid(
                row=i,
                column=1,
                padx=15,
                pady=7
            )

            self.add_entries[key] = entry

        ttk.Label(
            form,
            text="Skill Levels format:"
        ).grid(
            row=len(fields),
            column=0,
            sticky="w",
            pady=7
        )

        ttk.Label(
            form,
            text="Python:4, Machine Learning:3, SQL:5"
        ).grid(
            row=len(fields),
            column=1,
            sticky="w",
            padx=15
        )

        self.private_var = tk.IntVar(
            value=1
        )

        self.public_var = tk.IntVar(
            value=1
        )

        ttk.Checkbutton(
            form,
            text="Allow private chat",
            variable=self.private_var
        ).grid(
            row=len(fields)+1,
            column=1,
            sticky="w",
            padx=15
        )

        ttk.Checkbutton(
            form,
            text="Allow public replies",
            variable=self.public_var
        ).grid(
            row=len(fields)+2,
            column=1,
            sticky="w",
            padx=15
        )

        ttk.Button(
            form,
            text="Create User",
            style="Main.TButton",
            command=self.add_user
        ).grid(
            row=len(fields)+3,
            column=1,
            sticky="w",
            pady=20
        )

    # --------------------------------------------------------

    def add_user(self):

        global users_df

        data = {}

        for key, entry in self.add_entries.items():

            data[key] = entry.get().strip()

        if not data["user_id"] or not data["name"]:

            messagebox.showwarning(
                "Missing",
                "User ID and Name are required."
            )

            return

        if data["user_id"] in users_df["user_id"].astype(str).values:

            messagebox.showerror(
                "Duplicate",
                "This User ID already exists."
            )

            return

        p = get_personality(
            len(users_df)
        )

        data.update(p)

        data["private_chat"] = self.private_var.get()
        data["public_reply"] = self.public_var.get()

        users_df = pd.concat(
            [
                users_df,
                pd.DataFrame([data])
            ],
            ignore_index=True
        )

        users_df = users_df[USER_COLUMNS]

        save_users()

        self.refresh_user_dropdown()
        self.refresh_request_users()
        self.update_dashboard()

        messagebox.showinfo(
            "Success",
            "User added successfully."
        )


# ============================================================
# START APPLICATION
# ============================================================

if __name__ == "__main__":

    root = tk.Tk()

    app = SkillConnectApp(
        root
    )

    root.mainloop()