import React from "react";
//COMPONENTS
import ContactusPage from "../../pages/contact-us/ContactusPage";
import OrdersPage from "../../pages/orders/OrdersPage";
import DevicesPage from "../../pages/devices/DevicesPage";
import UsersPage from "../../pages/users/UsersPage";
import SignInPage from "../../pages/authentication/SignInPage";
import BundlesList from "../../pages/bundles/BundlesList";
import RouteWrapper from "./RouteWrapper";
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";
import TagList from "../../pages/tags/TagList";
import GroupsList from "../../pages/groups/GroupsList";
import UserDetail from "../../pages/users/UserDetail";
import GroupsHandle from "../../pages/groups/GroupsHandle";
import AssignBundleToGroups from "../../pages/AssignBundleToGroups/AssignBundleToGroups";
import RulesList from "../../pages/rules/RulesList";
import PromotionsList from "../../pages/promotions/PromotionsList";
import HandlePromotions from "../../pages/promotions/HandlePromotions";
import PromoAnalysis from "../../pages/promotions/PromoAnalysis";
import VoucherPage from "../../pages/vouchers/VoucherPage";
import Settings from "../../pages/settings/Settings";
import EditSettings from "../../pages/settings/EditSettings";
import Referrals from "../../pages/referral/Referrals";
import SettingsLogs from "../../pages/settings/SettingsLogs";
import SettingsLogsDetail from "../../pages/settings/SettingsLogsDetail";

export const privateRoutes = [
  {
    path: "/",
    element: <RouteWrapper shouldbeLoggedIn={true} />,
    key: "/users",
    name: "Users",
    regex: "^/users/?$",
    children: [
      {
        index: true,
        element: <UsersPage />,
        key: "/users",
        name: "Users",
        regex: "^/users/?$",
      },
      {
        path: "/users",
        element: <UsersPage />,
        key: "/users",
        name: "Users",
        regex: "^/users/?$",
      },
      {
        path: "/devices",
        element: <DevicesPage />,
        key: "/users",
        name: "Devices",
        regex: "^/devices/?$",
      },
      {
        path: "/orders",
        element: <OrdersPage />,
        key: "/orders",
        name: "Orders",
        regex: "^/orders/?$",
      },
      {
        path: "/users/:id",
        element: <UserDetail />,
        key: "/users/:id",
        name: "User Detail",
        regex: "^/users/([0-9a-fA-F-]+)$",
      },
      {
        path: "/contact-us",
        element: <ContactusPage />,
        key: "/contact-us",
        name: "Contact Us",
        regex: "^/contact-us/?$",
      },
      {
        path: "/bundles",
        element: <BundlesList />,
        key: "/bundles",
        name: "Bundles",
        regex: "^/bundles/?$",
      },
      {
        path: "/bundles/:bundleId/assign",
        element: <AssignBundleToGroups />,
        key: "/bundles/:bundleId/assign",
        name: "Assign Bundle To Groups",
        regex: "^/bundles/([0-9a-fA-F-]+)/assign?$",
      },
      {
        path: "/groups",
        element: <GroupsList />,
        key: "/groups",
        name: "Groups",
        regex: "^/groups/?$",
      },
      {
        path: "/groups/add",
        element: <GroupsHandle />,
        key: "/groups/add",
        name: "Add Group",
        regex: "^/groups/add?$",
      },
      {
        path: "/groups/:id",
        element: <GroupsHandle />,
        key: "/groups/:id",
        name: "Edit Group",
        regex: "^/groups/([0-9a-fA-F-]+)$",
      },
      {
        path: "/tags",
        element: <TagList />,
        key: "/tags",
        name: "Tags",
        regex: "^/tags/?$",
      },
      {
        path: "/rules",
        element: <RulesList />,
        key: "/rules",
        name: "Rules",
        regex: "^/rules/?$",
      },
      {
        path: "/vouchers",
        element: <VoucherPage />,
        key: "/vouchers",
        name: "Vouchers",
        regex: "^/vouchers/?$",
      },
      {
        path: "/settings",
        element: <Settings />,
        key: "/settings",
        name: "Settings",
        regex: "^/settings/?$",
        superAdminAccess: true,
      },
      {
        path: "/settings/edit",
        element: <EditSettings />,
        key: "/settings/edit",
        name: "Edit Settings",
        regex: "^/settings/edit/?$",
        superAdminAccess: true,
      },
      {
        path: "/settings/logs",
        element: <SettingsLogs />,
        key: "/settings/logs",
        name: "Settings Logs",
        regex: "^/settings/logs/?$",
        superAdminAccess: true,
      },

      {
        path: "/promotions",
        element: <PromotionsList />,
        key: "/promotions",
        name: "Promotions",
        regex: "^/promotions/?$",
      },
      {
        path: "/promotions/add",
        element: <HandlePromotions />,
        key: "/promotions/add",
        name: "Add Promotion",
        regex: "^/promotions/add?$",
      },
      {
        path: "/promotions/:id",
        element: <HandlePromotions />,
        key: "/promotions/:id",
        name: "Edit Promotion",
        regex: "^/promotions/([0-9a-fA-F-]+)?$",
      },
      {
        path: "/promo-analysis",
        element: <PromoAnalysis />,
        key: "/promo-analysis",
        name: "Promo Analysis",
        regex: "^/promo-analysis/?$",
      },
      {
        path: "/referrals",
        element: <Referrals />,
        key: "/referrals",
        name: "Referrals",
        regex: "^/referrals/?$",
      },
      {
        path: "*",
        element: <PageNotFound />,
        key: "/bundles",
        name: "Bundles",
        regex: "^/bundles/?$",
      },
    ],
  },
];

export const publicRoutes = [
  {
    path: "/",
    element: <RouteWrapper shouldbeLoggedIn={false} />,
    key: "/",
    name: "Signin",
    regex: "^/signin/?$",
    children: [
      {
        index: true,
        element: <SignInPage />,
      },
      {
        path: "/signin",
        element: <SignInPage />,
        regex: "^/signin/?$",
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
];
