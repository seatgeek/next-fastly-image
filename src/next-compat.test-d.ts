/**
 * Compile-time guard: our structural loader params must stay assignable
 * from next/image's real types. `next` is never a hard runtime dependency:
 * the core and /next entries stay next-free (it is a devDependency here and
 * an optional peer for the /component entry only). This file is type-checked
 * by `tsc --noEmit` and never built or executed.
 */
import type { ImageLoader, ImageLoaderProps, ImageProps } from "next/image";
import type { JSX } from "react";
import { FastlyImage, type FastlyImageProps } from "./component";
import { createFastlyLoader } from "./next";

// next/image must be able to call what createFastlyLoader returns…
const _loader: ImageLoader = createFastlyLoader();
const _thumb: ImageLoader = createFastlyLoader("thumbnail");

// …and our loader must accept exactly what next/image passes.
const _url: string = createFastlyLoader()({} as ImageLoaderProps);

// FastlyImage must accept the standard next/image prop surface (minus loader,
// which is deliberately not overridable) and be usable as a JSX component.
const _props: FastlyImageProps = {} as Omit<ImageProps, "loader">;
const _component: (props: FastlyImageProps) => JSX.Element = FastlyImage;

// The loader prop must NOT be accepted.
const _rejectsLoader: "loader" extends keyof FastlyImageProps ? never : true = true;
