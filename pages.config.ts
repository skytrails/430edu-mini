import { defineUniPages } from "@uni-helper/vite-plugin-uni-pages";

export default defineUniPages({
  globalStyle: {
    navigationStyle: "default",
    navigationBarTitleText: "智趣猴",
    navigationBarBackgroundColor: "#d07827",
    navigationBarTextStyle: "white",
    backgroundColor: "#000000",
  },
  easycom: {
    autoscan: true,
    custom: {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue",
      "^(?!z-paging-refresh|z-paging-load-more)z-paging(.*)":
        "z-paging/components/z-paging$1/z-paging$1.vue",
    },
  },
  tabBar: {
    color: "#aaa",
    selectedColor: "#d81e06",
    backgroundColor: "#F8F8F8",
    borderStyle: "black",
    height: "50px",
    fontSize: "11px",
    iconWidth: "24px",
    spacing: "3px",
    list: [
      {
        iconPath: "static/tabbar/tabbar-01.png",
        selectedIconPath: "static/tabbar/tabbar-02.png",
        pagePath: "pages/shift/shift",
        text: "排班",
      },
      {
        iconPath: "static/tabbar/tabbar-message-2.png",
        selectedIconPath: "static/tabbar/tabbar-message.png",
        pagePath: "pages/message/message",
        text: "消息",
      },
      {
        iconPath: "static/tabbar/tabbar-contact-01.png",
        selectedIconPath: "static/tabbar/tabbar-contact-02.png",
        pagePath: "pages/index/index",
        text: "通讯录",
      },
      {
        iconPath: "static/tabbar/tabbar-user-01.png",
        selectedIconPath: "static/tabbar/tabbar-user-02.png",
        pagePath: "pages/user/people",
        text: "个人",
      },
    ],
  },
});
