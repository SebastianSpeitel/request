type Falsy = false | 0 | "" | null | undefined;

export type EndpointOptions<
  R extends EndpointResponse = EndpointResponse
> = RequestInit &
  (R extends void
    ? { parse?: never }
    : R extends Response
    ? { parse: Falsy }
    : {
        parse: R extends ArrayBuffer
          ? "arrayBuffer"
          : R extends Blob
          ? "blob"
          : R extends FormData
          ? "formData"
          : R extends string
          ? "text" | "json"
          : "json";
      });

export type EndpointResponse =
  | void
  | Response
  | ArrayBuffer
  | Blob
  | FormData
  | string
  | object
  | number
  | boolean;

export type Endpoint<
  D = any,
  R extends EndpointResponse = EndpointResponse,
  O extends EndpointOptions<R> = never
> = ((data?: D) => (opts?: O) => R) | ((data?: D) => Exclude<R, Function>);

export type Routes = {
  [route: string]: Endpoint;
};

type ReqRoute<T extends Routes> = keyof T;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K;
}[keyof T];

type NeverKeys<T> = {
  [K in keyof T]: T[K] extends never ? K : never;
}[keyof T];

type SameValueKeys<T, U extends Record<any, any>> = {
  [K in keyof T]: T[K] extends U[K] ? (U[K] extends T[K] ? K : never) : never;
}[keyof T];

type FalsyValueKeys<T> = {
  [K in keyof T]: Falsy extends T[K] ? K : never;
}[keyof T];

type ReqOption<
  E extends Endpoint,
  D extends EndpointOptions
> = E extends Endpoint<infer _, infer R, infer O>
  ? {
      [K in Exclude<
        RequiredKeys<O>,
        | NeverKeys<EndpointOptions<R> & O>
        | SameValueKeys<EndpointOptions<R> & O, D>
        | (FalsyValueKeys<EndpointOptions<R> & O> & FalsyValueKeys<D>)
      >]-?: (EndpointOptions<R> & O)[K];
    } &
      Partial<EndpointOptions<R> & O>
  : EndpointOptions;

type ReqData<E extends Endpoint> = Parameters<E> extends { length: 0 }
  ? never
  : Parameters<E>[0];

type ReqParamList<E extends Endpoint, D extends EndpointOptions> = [
  ...(RequiredKeys<ReqOption<E, D>> extends never
    ? [options?: ReqOption<E, D>]
    : [options: ReqOption<E, D>]),
  ...(ReqData<E> extends never ? [] : [data: ReqData<E>])
];

type ReqResponse<E extends Endpoint> = E extends (
  d?: any
) => (o?: any) => infer R
  ? R
  : ReturnType<E>;

export let _fetch = fetch;

export function createRequest<
  Rs extends Routes,
  D extends EndpointOptions = EndpointOptions
>(
  baseUrl: string,
  defaultOptions: D = {} as D
): {
  <R extends ReqRoute<Rs>>(route: R, ...rest: ReqParamList<Rs[R], D>): Promise<
    ReqResponse<Rs[R]>
  >;
} {
  return ((
    route: ReqRoute<Rs>,
    options: EndpointOptions = defaultOptions,
    ...data: [data?: ReqData<Rs[ReqRoute<Rs>]>]
  ) => {
    const { parse, ...init } = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions?.headers,
        ...options?.headers
      }
    };
    if (data.length) init.body = JSON.stringify(data[0]);
    const respP = _fetch(baseUrl + route, init);
    if (parse) return respP.then(r => r[parse]());
    return respP;
  }) as any;
}
