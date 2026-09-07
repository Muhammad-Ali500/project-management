async def test_create_and_list_project(client):
    payload = {"name": "Migrate to GKE", "description": "Move workloads to GKE", "owner": "alex"}
    create_resp = await client.post("/api/projects", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == payload["name"]
    assert created["status"] == "planned"

    list_resp = await client.get("/api/projects")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


async def test_get_missing_project_404(client):
    response = await client.get("/api/projects/000000000000000000000000")
    assert response.status_code == 404


async def test_update_and_delete_project(client):
    create_resp = await client.post(
        "/api/projects", json={"name": "Initial", "owner": "sam"}
    )
    project_id = create_resp.json()["id"]

    update_resp = await client.put(f"/api/projects/{project_id}", json={"status": "active"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "active"

    delete_resp = await client.delete(f"/api/projects/{project_id}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/projects/{project_id}")
    assert get_resp.status_code == 404
