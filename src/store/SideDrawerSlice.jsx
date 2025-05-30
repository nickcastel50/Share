const drawerWidthInitial = 370
const drawerHeightInitial = '50vh'


/**
 * SideDrawer store.
 *
 * @param {Function} set
 * @param {Function} get
 * @return {object} Zustand slice.
 */
export default function createSideDrawerSlice(set, get) {
  return {
    isSideDrawerEnabled: true,
    setIsSideDrawerEnabled: (isEnabled) => set(() => ({isSideDrawerEnabled: isEnabled})),

    drawerWidthInitial: drawerWidthInitial, // Leave constant. Don't change dynamically
    drawerHeightInitial: drawerHeightInitial, // Leave constant. Don't change dynamically
    // Just for test setup
    setDrawerHeightInitial: (height) => set(() => ({drawerHeightInitial: height})),

    leftDrawerWidth: drawerWidthInitial,
    setLeftDrawerWidth: (width) => set(() => ({leftDrawerWidth: width})),
    leftDrawerWidthInitial: drawerWidthInitial,

    rightDrawerWidth: drawerWidthInitial,
    setRightDrawerWidth: (width) => set(() => ({rightDrawerWidth: width})),
    rightDrawerWidthInitial: drawerWidthInitial,

    appsDrawerWidth: drawerWidthInitial,
    setAppsDrawerWidth: (width) => set(() => ({appsDrawerWidth: width})),
    appsDrawerWidthInitial: drawerWidthInitial,

    drawerHeight: drawerHeightInitial,
    setDrawerHeight: (height) => set(() => ({drawerHeight: height})),
  }
}
