# fishflow

```bash
cd fishflow/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

curl http://localhost:8000/v1/scenario/chinook_gulf_of_alaska_2022/geometries
curl http://localhost:8000/v1/scenario/chinook_gulf_of_alaska_2022/habitat
curl http://localhost:8000/v1/scenario/chinook_gulf_of_alaska_2022/matrices?start_date=2022-03-01&end_date=2022-03-30
```


https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/deploy-a-react-based-single-page-application-to-amazon-s3-and-cloudfront.html


https://github.com/aws-samples/react-cors-spa/blob/main/react-cors-spa-stack.yaml


npm run build
aws s3 sync build/ s3://fish-flow-react-bucket/ --delete
Then run an invalidation

aws s3 sync depth/ s3://fish-flow-data-bucket/depth/
aws s3 sync movement/ s3://fish-flow-data-bucket/movement/