import React from "react";
import type { SvgProps } from "react-native-svg";

import AlertCircleIcon from "@/assets/icons/AlertCircleIcon.svg";
import AnalyticsIcon from "@/assets/icons/AnalyticsIcon.svg";
import ArrowBackIcon from "@/assets/icons/ArrowBackIcon.svg";
import ArrowForwardIcon from "@/assets/icons/ArrowForwardIcon.svg";
import CalendarIcon from "@/assets/icons/CalendarIcon.svg";
import CameraIcon from "@/assets/icons/CameraIcon.svg";
import CartIcon from "@/assets/icons/CartIcon.svg";
import CheckmarkCircleIcon from "@/assets/icons/CheckmarkCircleIcon.svg";
import CheckmarkIcon from "@/assets/icons/CheckmarkIcon.svg";
import ChevronDownIcon from "@/assets/icons/ChevronDownIcon.svg";
import ChevronForwardIcon from "@/assets/icons/ChevronForwardIcon.svg";
import ChevronUpIcon from "@/assets/icons/ChevronUpIcon.svg";
import CloseIcon from "@/assets/icons/CloseIcon.svg";
import DocumentTextIcon from "@/assets/icons/DocumentTextIcon.svg";
import DownloadIcon from "@/assets/icons/DownloadIcon.svg";
import FolderIcon from "@/assets/icons/FolderIcon.svg";
import HeartIcon from "@/assets/icons/HeartIcon.svg";
import InfoCircleIcon from "@/assets/icons/InfoCircleIcon.svg";
import LanguageIcon from "@/assets/icons/LanguageIcon.svg";
import ListIcon from "@/assets/icons/ListIcon.svg";
import LocationIcon from "@/assets/icons/LocationIcon.svg";
import LockIcon from "@/assets/icons/LockIcon.svg";
import LogOutIcon from "@/assets/icons/LogOutIcon.svg";
import MailIcon from "@/assets/icons/MailIcon.svg";
import MegaphoneIcon from "@/assets/icons/MegaphoneIcon.svg";
import NotificationsIcon from "@/assets/icons/NotificationsIcon.svg";
import OptionsIcon from "@/assets/icons/OptionsIcon.svg";
import PersonIcon from "@/assets/icons/PersonIcon.svg";
import PhoneIcon from "@/assets/icons/PhoneIcon.svg";
import PlusCircleIcon from "@/assets/icons/PlusCircleIcon.svg";
import ReceiptIcon from "@/assets/icons/ReceiptIcon.svg";
import RefreshIcon from "@/assets/icons/RefreshIcon.svg";
import ServerIcon from "@/assets/icons/ServerIcon.svg";
import ShieldCheckIcon from "@/assets/icons/ShieldCheckIcon.svg";
import StarIcon from "@/assets/icons/StarIcon.svg";
import TrashIcon from "@/assets/icons/TrashIcon.svg";
import TimeIcon from "@/assets/icons/TimeIcon.svg";

const iconMap = {
  "alert-circle-outline": AlertCircleIcon,
  "analytics-outline": AnalyticsIcon,
  "arrow-back": ArrowBackIcon,
  "arrow-forward": ArrowForwardIcon,
  "calendar-outline": CalendarIcon,
  camera: CameraIcon,
  "cart-outline": CartIcon,
  cart: CartIcon,
  "checkmark-circle": CheckmarkCircleIcon,
  checkmark: CheckmarkIcon,
  "chevron-forward": ChevronForwardIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
  close: CloseIcon,
  "close-circle": CloseIcon,
  "document-text-outline": DocumentTextIcon,
  "document-text": DocumentTextIcon,
  "download-outline": DownloadIcon,
  "folder-open-outline": FolderIcon,
  "heart-outline": HeartIcon,
  "information-circle": InfoCircleIcon,
  "information-circle-outline": InfoCircleIcon,
  "language-outline": LanguageIcon,
  "list-outline": ListIcon,
  "location-outline": LocationIcon,
  location: LocationIcon,
  "lock-closed-outline": LockIcon,
  "log-out-outline": LogOutIcon,
  "mail-outline": MailIcon,
  mail: MailIcon,
  "megaphone-outline": MegaphoneIcon,
  "notifications-outline": NotificationsIcon,
  "options-outline": OptionsIcon,
  "grid-outline": OptionsIcon,
  person: PersonIcon,
  "person-outline": PersonIcon,
  "phone-portrait-outline": PhoneIcon,
  "add-circle-outline": PlusCircleIcon,
  "time-outline": TimeIcon,
  "trash-outline": TrashIcon,
  trash: TrashIcon,
  "shield-checkmark-outline": ShieldCheckIcon,
  "receipt-outline": ReceiptIcon,
  refresh: RefreshIcon,
  server: ServerIcon,
  star: StarIcon,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = "#000", ...rest }: IconProps) {
  const Component = iconMap[name];
  if (!Component) return null;
  return (
    <Component
      width={size}
      height={size}
      stroke={color}
      color={color}
      fill={color}
      {...rest}
    />
  );
}
