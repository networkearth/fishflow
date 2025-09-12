# fishflow

```bash
cd fishflow/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

curl http://localhost:8000/v1/scenario/chinook_gulf_of_alaska_2022/geometries
curl http://localhost:8000/v1/scenario/chinook_gulf_of_alaska_2022/habitat
```