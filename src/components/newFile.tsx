import { Picture } from "astro:assets";
import logo from "../assets/ojoanalogo.jpg";
import SideBarFooter from "./SidebarFooter.astro";
import SideBarMenu from "./SidebarMenu.astro";

<Fragment>
<div class="drawer-side drop-shadow-xl shadow-md">
<label for="my-drawer" class="drawer-overlay"></label>
<aside class="px-2 pt-2 h-auto min-h-full w-[14rem] bg-base-200 text-base-content flex flex-col">
<div class="m-auto">
<div class="w-fit mx-auto mt-5 mb-2">
<div class="avatar transition ease-in-out hover:scale-[102%] flex items-center justify-center">
<div class="w-[4.5rem]">
<a target="_blank" href="https://threads.net/@ojo.analogo">
<Picture class="mask mask-circle" src={logo} widths={[300]} alt="Profile image`" />
</a>
</div>
</div>
<p class="font-bold text-2xl mt-4">Alfonso Reyes</p>
</div>
<SideBarMenu sideBarActiveItemID={sideBarActiveItemID} />
<SideBarFooter />
</div>
</aside>
</div>

</Fragment>;
