from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ram(BaseModel):
    ram_pourcentage: float

ram_usage = []


# @app.get("/")
# def root():
#     return {"Hello": "World"}


@app.post("/metric/ram")
def post_ram_info(item: ram):
    ram_usage.append(item)
    return item
    

@app.get("/metric/ram")
def get_all_ram():
    return ram_usage


@app.get("/metric/ram/{item_id}", response_model=ram)
def get_item(item_id: int) -> ram:
    if item_id < len(ram_usage):
        return ram_usage[item_id]
    else:
        raise HTTPException(status_code=404, detail="Item not found")


