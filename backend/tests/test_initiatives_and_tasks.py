async def test_initiative_and_task_lifecycle(client):
    project_resp = await client.post(
        "/api/projects", json={"name": "Platform Revamp", "owner": "jamie"}
    )
    project_id = project_resp.json()["id"]

    initiative_resp = await client.post(
        f"/api/projects/{project_id}/initiatives",
        json={"title": "Adopt CI/CD", "priority": "high"},
    )
    assert initiative_resp.status_code == 201
    initiative_id = initiative_resp.json()["id"]
    assert initiative_resp.json()["project_id"] == project_id

    task_resp = await client.post(
        f"/api/initiatives/{initiative_id}/tasks",
        json={"title": "Write GitHub Actions workflow", "assignee": "jamie"},
    )
    assert task_resp.status_code == 201
    task_id = task_resp.json()["id"]
    assert task_resp.json()["initiative_id"] == initiative_id

    list_tasks_resp = await client.get(f"/api/initiatives/{initiative_id}/tasks")
    assert list_tasks_resp.status_code == 200
    assert len(list_tasks_resp.json()) == 1

    update_resp = await client.put(f"/api/tasks/{task_id}", json={"status": "done"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "done"


async def test_initiative_for_missing_project_404(client):
    response = await client.post(
        "/api/projects/000000000000000000000000/initiatives",
        json={"title": "Orphan initiative"},
    )
    assert response.status_code == 404
