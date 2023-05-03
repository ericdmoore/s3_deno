
testing:

	export AWS_REGION=us-east-1;
	
	# Example Value
	export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE;
	# Example Value
	export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY;
	
	export S3_ENDPOINT_URL=http://localhost:9000;
	deno test ./tests --allow-env
	
	# docker-compose up -d
	# aws --endpoint-url=http://localhost:9000 s3 rm --recursive s3://test || true
	# aws --endpoint-url=http://localhost:9000 s3 rb s3://test || true
	# aws --endpoint-url=http://localhost:9000 s3 mb s3://test
	# aws --endpoint-url=http://localhost:9000 s3 rm --recursive s3://create-bucket-test || true
	# aws --endpoint-url=http://localhost:9000 s3 rb s3://create-bucket-test || true

cleanup:
	docker-compose down