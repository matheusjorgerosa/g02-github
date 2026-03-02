from fastapi import FastAPI
import pandas as pd
import ast
from datetime import datetime
import uuid

app = FastAPI()

CSV_PATH = "./data/fluxo_diario_20260106.csv"


def load_data():
    df = pd.read_csv(CSV_PATH)

    if "target" in df.columns:
        df["target"] = df["target"].apply(lambda x: ast.literal_eval(x) if pd.notnull(x) else {})

    return df


@app.get("/mock-api-claro")
def get_analytics():
    df = load_data()

    total_impressions = df["uniques"].sum()

    impressions = {
        "data": [{"total_trips": int(total_impressions)}],
        "metadata": {
            "num_records": 1,
            "page_num": None,
            "page_size": None,
            "used_locations": 0,
        },
    }

    impressions_by_hour_df = (
        df.groupby("impression_hour")["uniques"]
        .sum()
        .reset_index()
        .sort_values("impression_hour")
    )

    impressions_by_hour = {
        "data": impressions_by_hour_df.rename(
            columns={"uniques": "total_trips"}
        ).to_dict(orient="records"),
        "metadata": {
            "num_records": impressions_by_hour_df.shape[0],
            "page_num": None,
            "page_size": None,
            "used_locations": 0,
        },
    }

    age_gender_data = []

    if "target" in df.columns:
        for _, row in df.iterrows():
            uniques = row["uniques"]
            target = row["target"]

            if "idade" in target and "genero" in target:
                for age, age_pct in target["idade"].items():
                    for gender, gender_pct in target["genero"].items():
                        estimated_uniques = uniques * age_pct * gender_pct
                        age_gender_data.append({
                            "age": age,
                            "gender": gender,
                            "uniques": int(estimated_uniques)
                        })

    age_gender_df = pd.DataFrame(age_gender_data)

    if not age_gender_df.empty:
        age_gender_df = (
            age_gender_df.groupby(["age", "gender"])["uniques"]
            .sum()
            .reset_index()
        )

    uniques_by_age_and_gender = {
        "data": age_gender_df.to_dict(orient="records"),
        "metadata": {
            "num_records": age_gender_df.shape[0],
            "page_num": None,
            "page_size": None,
            "used_locations": 0,
        },
    }

    social_class_data = []

    if "target" in df.columns:
        for _, row in df.iterrows():
            uniques = row["uniques"]
            target = row["target"]

            if "classe_social" in target:
                for social_class, pct in target["classe_social"].items():
                    social_class_data.append({
                        "social_class": social_class,
                        "uniques": int(uniques * pct)
                    })

    social_class_df = pd.DataFrame(social_class_data)

    if not social_class_df.empty:
        social_class_df = (
            social_class_df.groupby("social_class")["uniques"]
            .sum()
            .reset_index()
        )

    uniques_by_social_class = {
        "data": social_class_df.to_dict(orient="records"),
        "metadata": {
            "num_records": social_class_df.shape[0],
            "page_num": None,
            "page_size": None,
            "used_locations": 0,
        },
    }

    unique_devices = {
        "data": [{"uniques": int(total_impressions)}],
        "metadata": {
            "num_records": 1,
            "page_num": None,
            "page_size": None,
            "used_locations": 0,
        },
    }

    response = {
        "data": {
            "impressions": impressions,
            "impressions_by_hour": impressions_by_hour,
            "unique_devices": unique_devices,
            "uniques_by_age_and_gender": uniques_by_age_and_gender,
            "uniques_by_social_class": uniques_by_social_class,
        },
        "map_data": {
            "data_escrita": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "map_id": str(uuid.uuid4()),
            "map_name": "SP-CI794!"
        },
        "metadata": {
            "locations": []
        }
    }

    return response