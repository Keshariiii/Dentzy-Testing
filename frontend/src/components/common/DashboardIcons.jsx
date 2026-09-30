/**
 * DashboardIcons — Shared icon library for Desktop & Mobile dashboards.
 * Single source of truth: re-exports lucide-react icons wrapped to match
 * the existing API: Icons.name(size) => ReactElement.
 *
 * Ponytail: lucide-react is already in package.json but was unused.
 * This eliminates ~60 lines of hand-rolled SVG paths.
 */
import React from 'react';
import {
  LayoutGrid,
  Package as PackageIcon,
  CreditCard,
  Settings,
  Search,
  LogOut,
  FileText,
  CheckCircle2,
  Wallet,
  Clock,
  BarChart3,
  Inbox,
  User,
  Mail,
  Shield,
  MessageSquare,
  Download,
  Phone,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  Bell,
  Lock,
  Check,
  X,
  Plus,
  Filter,
  MapPin,
  Calendar,
  Home,
  MoreVertical,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

/** Backward-compat wrapper: <Icon d={...} /> is no longer needed but kept for
 *  any stray consumers. Renders a lucide-style SVG from raw children. */
export const Icon = ({ d, size = 18, strokeWidth = 1.8, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

/* Helper: wrap a lucide component so it matches the old API: Icons.name(size) */
const wrap = (LucideIcon, defaultSize = 18, defaultStrokeWidth = 1.8) =>
  (s = defaultSize, sw = defaultStrokeWidth) =>
    <LucideIcon size={s} strokeWidth={sw} />;

export const Icons = {
  dashboard:   wrap(LayoutGrid),
  labOrder:    wrap(PackageIcon),
  payments:    wrap(CreditCard),
  settings:    wrap(Settings),
  search:      wrap(Search, 15),
  logout:      wrap(LogOut, 15),
  orders:      wrap(FileText, 22, 1.5),
  checkCircle: wrap(CheckCircle2, 22, 1.5),
  wallet:      wrap(Wallet, 22, 1.5),
  clock:       wrap(Clock, 22, 1.5),
  barChart:    wrap(BarChart3, 40, 1.2),
  fileText:    wrap(FileText, 40, 1.2),
  inbox:       wrap(Inbox, 40, 1.2),
  user:        wrap(User),
  mail:        wrap(Mail),
  shield:      wrap(Shield),
  chat:        wrap(MessageSquare, 22, 1.5),
  download:    wrap(Download, 15, 2.2),
  phone:       wrap(Phone, 13),
  trash:       wrap(Trash2, 14),
  warn:        wrap(AlertTriangle, 26),
  eye:         (s = 16, show = false) => show
    ? <EyeOff size={s} strokeWidth={1.8} />
    : <Eye size={s} strokeWidth={1.8} />,

  // Admin & Common Extensions
  grid:        wrap(LayoutGrid, 16),
  chart:       wrap(BarChart3, 16),
  users:       wrap(Users, 48, 1.2),
  usersS:      wrap(Users, 22, 1.6),
  bell:        wrap(Bell, 16),
  clockS:      wrap(Clock, 22, 1.6),
  lock:        wrap(Lock, 12),
  check:       wrap(Check, 13, 2.5),
  checkS:      wrap(Check, 22, 2),
  x:           wrap(X, 13, 2.5),
  xS:          wrap(X, 22, 2),
  eyeOff:      (s = 13) => <EyeOff size={s} strokeWidth={1.8} />,
  plus:        (s = 24, c = 'currentColor') => <Plus size={s} color={c} strokeWidth={2} />,
  filter:      (s = 24, c = 'currentColor') => <Filter size={s} color={c} strokeWidth={2} />,
  map:         wrap(MapPin, 14),
  calendar:    wrap(Calendar, 14),
  clinic:      wrap(Home, 14),
  package:     wrap(PackageIcon, 32, 1.2),
  moreVertical: wrap(MoreVertical, 16),
  arrowLeft:   wrap(ArrowLeft, 18, 2),
  chevronDown: wrap(ChevronDown, 18, 2),
  chevronUp:   wrap(ChevronUp, 18, 2),
  chevronRight: wrap(ChevronRight, 18, 2),
  chevronLeft: wrap(ChevronLeft, 18, 2),
};

export const Ico = Icons;
