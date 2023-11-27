import Gallery from "../components/Gallery.astro";
import { SITE_TITLE } from "../config";
import BaseLayout from "./BaseLayout.astro";
import { publishDateString, updatedDateString } from './CollectionLayout.astro';

<Fragment>
<BaseLayout title={`${SITE_TITLE} - ${title}`} description={description} socialImagePath={socialImagePath} sideBarActiveItemID="collections">
<div class="pb-12 mt-5">
<div class="text-3xl font-bold mb-1">{title}</div>
<p class="text-sm text-gray-700">
Publicado: <span class="text-gray-900">{publishDateString}</span>
</p>
{updatedDate && (
<Fragment><p class="text-sm text-gray-700">
Actualizado: <span class="text-gray-900">{updatedDateString}</span>
</p></Fragment>
)}
<div class="mt-2">
{(tags ?? []).map((tag) => (
<Fragment><span class="badge badge-accent badge-md text-white mr-2">{tag}</span></Fragment>
))}
</div>
<div class="mb-4 mt-4">
<slot />
</div>

{photos.film?.length > 0 && (
<Fragment><div class="mb-4">
<h2 class="text-2xl font-bold mb-2">Film</h2>
<Gallery photos={filmPhotos} biggerPictures={false} />
</div></Fragment>
)}
{digitalPhotos?.length > 0 && (
<Fragment><div class="mb-4">
<h2 class="text-2xl font-bold mb-2">Digital</h2>
<Gallery photos={digitalPhotos} biggerPictures={false} />
</div></Fragment>
)}
{((filmPhotos?.length === 0 &&
digitalPhotos?.length === 0 &&
photos?.length === 0) ||
photos.length === 0) && (
<Fragment><div class="text-center text-gray-700">
<p class="text-5xl mb-12">🔍</p>
<p class="text-lg">
No hay fotos en esta colección, te invito a regresar a la{" "}
<a href="/collections" class="font-bold text-zinc-800">
galería
</a>
</p>
</div></Fragment>
)}
{photos.length > 0 && !filmPhotos?.length && !digitalPhotos.length && (
<Fragment><Gallery photos={photos} biggerPictures={true} /></Fragment>
)}
</div>
</BaseLayout>

</Fragment>;
