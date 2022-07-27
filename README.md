# deno_s3

<!-- ![ci](https://github.com/lucacasonato/deno_aws_sign_v4/workflows/ci/badge.svg) -->
<!-- [![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/s3@0.5.0/mod.ts) -->
<!-- [![Coverage Status](https://coveralls.io/repos/github/lucacasonato/deno_s3/badge.svg?branch=main)](https://coveralls.io/github/lucacasonato/deno_s3?branch=main) -->

Amazon S3 for Deno

> ⚠️ This project is work in progress. Expect breaking changes.

> Forked from the very wonderful project by `lucacasonato` solely for the purpose of removing the privlege escalation

## Install
``` bash
deno intall "https://denopkg.com/ericdmoore/s3_deno@main/mod.ts"
```

## Reqd Privs

> the package is an API wrapper
```
--allow-net amazonaws.com
```

## Example

```ts
import { S3, S3Bucket } from "https://denopkg.com/ericdmoore/s3_deno@main/mod.ts";

// Create a S3 instance.
const s3 = new S3({

  accessKeyID: "NOT_A_REAL_AWS_ACCESS_KEY"!,
  secretKey: "NOT_A_REAL_AWS_SECRET_ACCESS_KEY",
  region: "us-east-1",
  region: "us-east-1",
  endpointURL: getEndpointUrl()
});

// Create a new bucket.
let bucket = await s3.createBucket("test", { acl: "private" });

// Get an existing bucket.
bucket = s3.getBucket("test");

// Create a bucket instance manuely.
bucket = new S3Bucket({
  accessKeyID: "NOT_A_REAL_AWS_ACCESS_KEY"!,
  secretKey: "NOT_A_REAL_AWS_SECRET_ACCESS_KEY",
  bucket: "test",
  region: "us-east-1",
  endpointURL: getEndpointUrl()
});

const encoder = new TextEncoder();

// Put an object into a bucket.
await bucket.putObject("test", encoder.encode("Test1"), {
  contentType: "text/plain",
});

// Retrieve an object from a bucket.
const { body } = await bucket.getObject("test");
const data = await new Response(body).text();
console.log("File 'test' contains:", data);

// List objects in the bucket.
const list = bucket.listAllObjects({});
for await (const obj of list) {
  console.log("Item in bucket:", obj.key);
}

// Delete an object from a bucket.
await bucket.deleteObject("test");
```

## Contributing

```
make test
```

<!-- References -->
[ci_img]:''
[ci_url]:''

[cov_img]:''
[cov_url]:''