async def test_health_ok(client):
    response = await client.get("/health")
    assert response.status_code in (200, 503)
    assert "status" in response.json()
