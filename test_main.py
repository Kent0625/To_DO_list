from fastapi import FastAPI
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Kanban API is running"}


def test_create_task():
    response = client.post(
        "/tasks/",
        json={
            "title": "Test Task",
            "description": "Testing create endpoint",
            "status": "todo"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["title"] == "Test Task"
    assert data["description"] == "Testing create endpoint"
    assert data["status"] == "todo"


def test_read_tasks():
    response = client.get("/tasks/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)



def test_read_single_task():
    create = client.post("/tasks/", json={"title": "Sample"})
    task_id = create.json()["id"]

    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Sample"




def test_update_task():
    create = client.post("/tasks/", json={"title": "Old Title"})
    task_id = create.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={"title": "Updated Title"}
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"



def test_delete_task():
    create = client.post("/tasks/", json={"title": "Delete Me"})
    task_id = create.json()["id"]

    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200

    check = client.get(f"/tasks/{task_id}")

    assert check.status_code == 404

