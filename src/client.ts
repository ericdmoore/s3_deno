import { awsV4Sig, Signer } from "../deps.ts";
import type { CreateBucketOptions } from "./types.ts";
import { S3Error } from "./error.ts";
import { S3Bucket, type S3BucketConfig } from "./bucket.ts";
import { doRequest, encoder } from "./request.ts";
import type { Params, Fetcher } from "./request.ts";

export interface S3Config {
  region: string;
  accessKeyID: string;
  secretKey: string;
  sessionToken?: string;
  endpointURL?: string;
  internalFetch?: Fetcher
}

/**
 * A S3 instance can be used to manage multiple buckets.
 *
 * ```
 * const s3 = new S3({
 *   accessKeyID: "<AWS_ACCESS_KEY_ID>",
 *   secretKey: "<AWS_SECRET_ACCESS_KEY>",
 *   region: "eu-south-1",
 * });
 *
 * const bucket1: S3Bucket = s3.getBucket("my-bucket");
 * const bucket2: S3Bucket = await s3.createBucket("my-second-bucket");
 * ```
 */
export class S3 {
  readonly #config: S3Config;
  readonly #signer: Signer;
  readonly #host: string;
  readonly #internalFetch?: Fetcher

  constructor(config: S3Config) {
    this.#internalFetch = config.internalFetch
    this.#host = config.endpointURL ??
      `https://s3.${config.region}.amazonaws.com/`;
    this.#config = { ...config };
    this.#signer ={
      sign: (svc:string, req:Request) => awsV4Sig({
        service: svc,
        region: config.region,
        awsAccessKeyId: config.accessKeyID,
        awsSecretKey: config.secretKey,
        sessionToken: config.sessionToken
      })(req) 
    } as Signer
  }

  /** Creates a new S3Bucket instance with the same config passed to the S3 client. */
  getBucket(bucket: string): S3Bucket {
    return new S3Bucket(
      this.validateBucketName(bucket)
    )
  }

  /**
   * @see: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
   * @param bucket 
   * @throws on Validation  Error
   */
  validateBucketName(bucket:string): S3BucketConfig { 
    const errMsgs = ['Invalid Bucket Name:'] as string[]

    if(bucket.length <= 3  && bucket.length >= 63){
      errMsgs.push('- The length of the bucket name m,ust be between 3 and 63 characters long')
    } 
    if(/[^a-z0-9.-]/g.test(bucket)){
      errMsgs.push('- Bucket names can consist only of lowercase letters, numbers, dots (.), and hyphens (-).')
    }
    if( /[^a-z0-9]/.test(bucket[0])  || 
        /[^a-z0-9]/.test(bucket.slice(-1)) )
      {
        errMsgs.push('- Bucket names must begin and end with a letter or number.')
    }
    if(bucket.includes('..')){
      errMsgs.push('- Bucket names must not contain two adjacent periods.')
    }
    if( /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g.test(bucket) ){
      errMsgs.push('- Bucket names must not be formatted as an IP address (for example, 192.168.5.4).')
    }
    if(bucket.startsWith('xn--') ){
      errMsgs.push('- Bucket names must not start with the prefix xn--.')
    }
    if(bucket.endsWith('-s3alias') ){
      errMsgs.push('- Bucket names must not end with the suffix -s3alias. This suffix is reserved for access point alias names.')
    }  
    if(errMsgs.length > 1){
      throw new Error(errMsgs.join('\n'))
    }

    return{...this.#config, bucket }
  }

  /**
   * Creates a new S3 bucket. By default, the bucket is created in the region
   * specified with the S3 options. If not specified the US East (N. Virginia)
   * region is used. Optionally, you can specify a Region with the
   * `locationConstraint` option.
   *
   * ```
   * const bucket: S3Bucket = await s3.createBucket("my-bucket", {
   *   locationConstraint: "EU",
   * });
   * ```
   */
  async createBucket(
    bucket: string,
    options?: CreateBucketOptions
  ): Promise<S3Bucket> {
    // throws on validation Error
    this.validateBucketName(bucket)
    const headers: Params = {};

    if (options?.acl) {
      headers["x-amz-acl"] = options.acl;
    }
    if (options?.grantFullControl) {
      headers["x-amz-grant-full-control"] = options.grantFullControl;
    }
    if (options?.grantRead) {
      headers["x-amz-grant-read"] = options.grantRead;
    }
    if (options?.grantReadAcp) {
      headers["x-amz-grant-read-acp"] = options.grantReadAcp;
    }
    if (options?.grantWrite) {
      headers["x-amz-grant-write"] = options.grantWrite;
    }
    if (options?.grantWriteAcp) {
      headers["x-amz-grant-write-acp"] = options.grantWriteAcp;
    }
    if (options?.bucketObjectLockEnabled) {
      headers["x-amz-bucket-object-lock-enabled"] =
        options.bucketObjectLockEnabled;
    }

    const body = encoder.encode(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
        `   <LocationConstraint>${
          options?.locationConstraint ?? this.#config.region
        }</LocationConstraint>` +
        "</CreateBucketConfiguration>",
    );

    const resp = await doRequest({
      host: this.#host,
      signer: this.#signer,
      path: bucket,
      method: "PUT",
      headers,
      body,
      internalFetch: this.#internalFetch
    });

    if (resp.status !== 200) {
      throw new S3Error(
        `Failed to create bucket "${bucket}": ${resp.status} ${resp.statusText}`,
        await resp.text(),
      );
    }

    // clean up http body
    await resp.arrayBuffer();
    return this.getBucket(bucket);
  }
}
