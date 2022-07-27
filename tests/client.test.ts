import { assertEquals, assertThrows } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { S3Error } from "../src/error.ts";
import { S3 } from "../src/client.ts";
import { encoder } from "../src/request.ts";
import { terribleS3ServerMock } from './s3NetworkMock.ts'
import config from '../env.ts'

Deno.test('Create/Ensure Bucket Exists ', async (t)=>{

  const s3 = new S3({
      // endpointURL: config.endpointURL
      region: config.region,
      accessKeyID: config.accessKeyID,
      secretKey: config.secretKey,
      ...( (await Deno.permissions.query({name: 'net'})).state === 'granted'
        ? {}
        : {internalFetch: terribleS3ServerMock()} )
    })

  const b = await s3.createBucket(config.bucket).catch(() => s3.getBucket(config.bucket))
  // console.log(b)

  await t.step({
    name: "[client] should get an existing bucket",
    async fn() {
      const bucket = await s3.getBucket("test");
  
      // Check if returned bucket instance is working.
      await bucket.putObject("test", encoder.encode("test"));
      const resp = await bucket.getObject("test");
      const body = await new Response(resp?.body).text();

      assertEquals(body, "test");
      // teardown
      await bucket.deleteObject("test");
    },
  });
  
  await t.step({
    name: "[client] should create a new bucket",
    async fn() {
      const bucket = await s3.createBucket("create-bucket-test", {
        acl: "public-read-write",
      });
  
      // Check if returned bucket instance is working.
      await bucket.putObject("test", encoder.encode("test"));
      const resp = await bucket.getObject("test");
      const body = await new Response(resp?.body).text();
      assertEquals(body, "test");

      // teardown
      await bucket.deleteObject("test");

      await assertThrows(
        () => s3.createBucket("create-bucket-test"),
        S3Error,
        'Failed to create bucket "create-bucket-test": 409 Conflict',
      );

      // @TODO: delete also bucket once s3.deleteBucket is implemented.
    }
  });
  
  const removed = await b.empty()
  console.log({removed})
  
})

