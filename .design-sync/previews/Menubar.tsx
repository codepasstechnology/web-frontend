import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "land-eye-kenya-frontend";

export const MapTools = () => (
  <div className="h-56 w-96">
    <Menubar value="view">
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Satellite <MenubarShortcut>S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Street map</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Show parcel boundaries</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="tools">
        <MenubarTrigger>Tools</MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  </div>
);
