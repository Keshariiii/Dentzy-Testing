import { formatDoctorName } from './format.js';

const LAB_SUPPORT_PHONE_HREF = 'tel:+919503668112';
const LAB_SUPPORT_EMAIL_HREF = 'mailto:support@dentzy.in';

function parseSearchParams(search = '') {
  if (!search) return new URLSearchParams();
  const normalized = search.startsWith('?') ? search : `?${search}`;
  return new URLSearchParams(normalized);
}

/**
 * Appends `portal=lab` to `/invoice?...` links launched from Lab Admin or Staff portals
 * so an expired session still renders the Lab Sign-In POV rather than defaulting to Dentist.
 */
export function appendLabPortalHint(url, currentPathname = '') {
  if (typeof url !== 'string' || !url.startsWith('/invoice')) return url;
  if (!currentPathname.startsWith('/admin') && !currentPathname.startsWith('/staff')) {
    return url;
  }
  const [pathAndQuery, hash = ''] = url.split('#');
  const [path, rawQuery = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(rawQuery);
  if (params.has('portal')) return url;
  params.set('portal', 'lab');
  const queryStr = params.toString();
  return `${path}${queryStr ? `?${queryStr}` : ''}${hash ? `#${hash}` : ''}`;
}

/**
 * Resolves the caller's portal POV ('dentist' | 'lab' | 'guest') and navigation metadata.
 * Authenticated roles always take precedence over URL hints.
 */
export function resolvePortalContext({
  pathname = '',
  search = '',
  user = null,
  staff = null,
  admin = null,
  pov: povOverride = null,
} = {}) {
  const onAdminPath = pathname.startsWith('/admin');
  const onStaffPath = pathname.startsWith('/staff');
  const onDashPath = pathname.startsWith('/dashboard');

  if (onAdminPath || (admin && !onDashPath && (!onStaffPath || admin.isExecutiveStaff))) {
    const isExecStaff = Boolean(admin?.isExecutiveStaff);
    const dashboardHref = isExecStaff ? '/staff/dashboard' : '/admin/dashboard';
    const paymentsHref = admin
      ? `${dashboardHref}?view=dentists&sub=payments`
      : '/login?role=admin';

    return {
      pov: 'lab',
      labScope: isExecStaff ? 'executive' : 'admin',
      isGuest: !admin,
      backHref: admin ? dashboardHref : '/login?role=admin',
      backLabel: admin
        ? isExecStaff
          ? 'Back to Lab Dashboard'
          : 'Back to Admin Dashboard'
        : 'Back to Admin Login',
      paymentsHref,
      ordersHref: admin ? dashboardHref : '/login?role=admin',
      loginHref: isExecStaff ? '/login?role=staff' : '/login?role=admin',
      portalBadge: 'Admin Portal',
      navUser: admin
        ? {
            name: admin.displayName || admin.username || 'Admin',
            role: admin.designation || 'Executive',
          }
        : null,
    };
  }

  if (onStaffPath || (staff && !onDashPath)) {
    return {
      pov: 'lab',
      labScope: 'staff',
      isGuest: !staff,
      backHref: staff ? '/staff/dashboard' : '/login?role=staff',
      backLabel: staff ? 'Back to Staff Dashboard' : 'Back to Staff Login',
      paymentsHref: staff ? '/staff/dashboard' : '/login?role=staff',
      ordersHref: staff ? '/staff/dashboard' : '/login?role=staff',
      loginHref: '/login?role=staff',
      portalBadge: 'Staff Portal',
      navUser: staff
        ? {
            name: staff.displayName || staff.username || 'Staff',
            role: staff.designation || 'Lab Staff',
          }
        : null,
    };
  }

  if (onDashPath || user) {
    return {
      pov: 'dentist',
      labScope: null,
      isGuest: !user,
      backHref: user ? '/dashboard' : '/login',
      backLabel: user ? 'Back to Dashboard' : 'Back to Login',
      paymentsHref: user ? '/dashboard?tab=payments' : '/login',
      ordersHref: user ? '/dashboard?tab=orders' : '/login',
      loginHref: '/login',
      portalBadge: 'Clinical Portal',
      navUser: user
        ? {
            name: formatDoctorName(user.name || user.clinicName),
            role: user.clinicName || null,
            avatar:
              (user.name || user.clinicName || 'D')
                .trim()
                .replace(/^(dr\s*\.?\s*)+/i, '')
                .charAt(0)
                .toUpperCase() || 'D',
          }
        : null,
    };
  }

  const params = parseSearchParams(search);
  const portalHint = params.get('portal') || params.get('pov');
  const hasLabHint =
    povOverride === 'lab' ||
    portalHint === 'lab' ||
    Boolean(params.get('dentistId'));

  if (hasLabHint) {
    return {
      pov: 'lab',
      labScope: 'staff',
      isGuest: true,
      backHref: '/login?role=staff',
      backLabel: 'Back to Lab Login',
      paymentsHref: '/login?role=staff',
      ordersHref: '/login?role=staff',
      loginHref: '/login?role=staff',
      portalBadge: 'Lab Portal',
      navUser: null,
    };
  }

  if (povOverride === 'dentist') {
    return {
      pov: 'dentist',
      labScope: null,
      isGuest: true,
      backHref: '/login',
      backLabel: 'Back to Login',
      paymentsHref: '/login',
      ordersHref: '/login',
      loginHref: '/login',
      portalBadge: 'Clinical Portal',
      navUser: null,
    };
  }

  return {
    pov: 'guest',
    labScope: null,
    isGuest: true,
    backHref: '/',
    backLabel: 'Back to Home',
    paymentsHref: '/login',
    ordersHref: '/login',
    loginHref: '/login',
    portalBadge: null,
    navUser: null,
  };
}

/**
 * Returns POV-specific footer navigation links for PortalStatusPage.
 */
export function getPortalFooterLinks(portal) {
  if (portal?.pov === 'dentist' && !portal.isGuest) {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'My Orders', href: '/dashboard?tab=orders' },
      { label: 'Invoices', href: '/dashboard?tab=payments' },
      { label: 'Lab Support', href: LAB_SUPPORT_PHONE_HREF, external: true },
      { label: 'support@dentzy.in', href: LAB_SUPPORT_EMAIL_HREF, external: true },
    ];
  }

  if (portal?.pov === 'lab') {
    if (portal.isGuest) {
      return [
        { label: 'Home', href: '/' },
        { label: 'Staff Login', href: '/login?role=staff' },
        { label: 'Admin Login', href: '/login?role=admin' },
      ];
    }

    if (portal.labScope === 'admin' || portal.labScope === 'executive') {
      return [
        { label: 'Lab Dashboard', href: portal.backHref },
        { label: 'Payments & Billing', href: portal.paymentsHref },
        { label: 'Staff Portal', href: '/staff/dashboard' },
        { label: 'Home', href: '/' },
      ];
    }

    return [
      { label: 'Staff Dashboard', href: portal.backHref },
      { label: 'Home', href: '/' },
    ];
  }

  return [
    { label: 'Home', href: '/' },
    { label: 'Dentist Login', href: '/login' },
    { label: 'Lab Login', href: '/login?role=staff' },
    { label: 'Lab Support', href: LAB_SUPPORT_PHONE_HREF, external: true },
    { label: 'support@dentzy.in', href: LAB_SUPPORT_EMAIL_HREF, external: true },
  ];
}

function buildLabBillingAction(portal) {
  const hasSeparateBillingTab = portal.paymentsHref && portal.paymentsHref !== portal.backHref;
  if (hasSeparateBillingTab) {
    return {
      primary: { label: 'Open Payments & Billing', href: portal.paymentsHref },
      secondary: { label: 'Lab Dashboard', href: portal.backHref },
    };
  }
  return {
    primary: {
      label: portal.isGuest ? 'Lab Sign In' : portal.backLabel.replace(/^Back to /, 'Open '),
      href: portal.backHref,
    },
    secondary: null,
  };
}

/**
 * Maps invoice fetch errors to Dentist POV, Our Lab POV, or Guest POV UI copy and actions.
 */
export function buildInvoiceStatusConfig({ error, batchId = null, id = null, portal }) {
  const status = error?.status || 0;
  const refCode = batchId || id || null;
  const isLab = portal?.pov === 'lab';
  const isDentist = portal?.pov === 'dentist';
  const eyebrowPrefix = isLab ? 'Lab Billing' : 'Invoice';
  const eyebrowStatus = status ? ` · HTTP ${status}` : '';
  const eyebrowRef = refCode ? ` · ${refCode}` : '';

  if (status === 401) {
    if (isLab) {
      return {
        eyebrow: `${eyebrowPrefix} · HTTP 401`,
        title: 'Lab Session Required',
        paragraphs: [
          'Your lab staff or executive session is not active or has expired. Sign in to view this billing statement.',
          'Use Staff Login for Receptionist credentials or Admin Login for Executive (CEO / CTO) credentials.',
        ],
        primaryAction: { label: 'Admin / CEO Sign In', href: '/login?role=admin' },
        secondaryAction: { label: 'Staff Sign In', href: '/login?role=staff' },
      };
    }

    return {
      eyebrow: 'Invoice · HTTP 401',
      title: 'Sign In to View Invoice',
      paragraphs: [
        'Please sign in to your Dentzy Clinical Portal account to view, print, or download this official invoice.',
        'Opening this link on behalf of the lab? Use the Lab Staff / Admin sign-in option below.',
      ],
      primaryAction: { label: 'Dentist Sign In', href: '/login' },
      secondaryAction: { label: 'Lab Staff / Admin Sign In', href: '/login?role=staff' },
    };
  }

  if (status === 403) {
    if (isLab) {
      return {
        eyebrow: `${eyebrowPrefix} · HTTP 403`,
        title: 'Billing Permission Required',
        paragraphs: [
          "Your current lab role doesn't have permission to view clinic invoices or billing statements.",
          'Switch to a Receptionist or Executive Admin (CEO / CTO) account in the Lab Portal to view or print this statement.',
        ],
        primaryAction: {
          label: portal.backLabel.replace(/^Back to /, 'Open '),
          href: portal.backHref,
        },
        secondaryAction: { label: 'Switch Lab Account', href: '/login?role=staff' },
      };
    }

    return {
      eyebrow: 'Invoice · HTTP 403',
      title: 'Access Restricted',
      paragraphs: [
        "This invoice statement belongs to another dental clinic and isn't accessible from your signed-in account.",
        'Sign in with the clinic account that placed the case, or contact Dentzy Lab Desk (+91 95036 68112) if you think this is a mistake.',
      ],
      primaryAction: { label: 'Go to My Invoices', href: portal?.paymentsHref || '/dashboard?tab=payments' },
      secondaryAction: { label: 'Switch Clinic Account', href: '/login' },
    };
  }

  if (status === 404) {
    if (isLab && !portal.isGuest) {
      const labActions = buildLabBillingAction(portal);
      return {
        eyebrow: `${eyebrowPrefix}${eyebrowStatus}${eyebrowRef}`,
        title: batchId ? 'Batch Invoice Not Found' : 'Invoice Record Not Found',
        paragraphs: [
          refCode
            ? `No payment or invoice record matches ${refCode} in the lab ledger. The batch may have been unlinked, or the case was cancelled before billing.`
            : 'No matching invoice or statement record was found in the lab ledger.',
          'Verify the Case ID or dentist ledger in Payments & Billing, or check with Reception / Executive Admin before re-issuing.',
        ],
        primaryAction: labActions.primary,
        secondaryAction: labActions.secondary,
      };
    }

    if (isDentist && !portal.isGuest) {
      return {
        eyebrow: `${eyebrowPrefix}${eyebrowStatus}${eyebrowRef}`,
        title: 'Invoice Not Found',
        paragraphs: [
          "We couldn't find this statement in your clinic billing history. It may have been cancelled, regenerated, or issued under another reference.",
          'Open Payments & Invoices in your portal for current bills, or contact Dentzy Lab Desk (+91 95036 68112) for a copy.',
        ],
        primaryAction: { label: 'Go to My Invoices', href: portal.paymentsHref },
        secondaryAction: { label: 'Call Lab Desk', href: LAB_SUPPORT_PHONE_HREF, external: true },
      };
    }

    if (isLab && portal.isGuest) {
      return {
        eyebrow: `${eyebrowPrefix}${eyebrowStatus}${eyebrowRef}`,
        title: 'Invoice Record Not Found',
        paragraphs: [
          refCode
            ? `We couldn't load ${refCode}. Sign in to the Lab Portal to inspect the dentist ledger and batch records.`
            : "We couldn't load this invoice record. Sign in to the Lab Portal to check Payments & Billing.",
          'Use Admin Login for Executive (CEO / CTO) access or Staff Login for Receptionist access.',
        ],
        primaryAction: { label: 'Admin / CEO Sign In', href: '/login?role=admin' },
        secondaryAction: { label: 'Staff Sign In', href: '/login?role=staff' },
      };
    }

    return {
      eyebrow: `${eyebrowPrefix}${eyebrowStatus}${eyebrowRef}`,
      title: 'Invoice Not Found',
      paragraphs: [
        'No invoice statement matched this link, or you may need to sign in first to access it.',
        'Sign in to your Dentzy Clinical Portal or contact Dentzy Lab Desk (+91 95036 68112) if you think this is a mistake.',
      ],
      primaryAction: { label: 'Dentist Sign In', href: '/login' },
      secondaryAction: { label: 'Return to Home', href: '/' },
    };
  }

  if (status === 400) {
    if (isLab) {
      const labActions = buildLabBillingAction(portal);
      return {
        eyebrow: `${eyebrowPrefix} · HTTP 400`,
        title: 'Invoice Reference Required',
        paragraphs: [
          'No batch ID, case ID, or dentist unpaid-bill parameter was supplied in this URL.',
          'Open Payments & Billing from the Lab Dashboard to launch a valid invoice or statement link.',
        ],
        primaryAction: labActions.primary,
        secondaryAction: labActions.secondary,
      };
    }

    return {
      eyebrow: 'Invoice · HTTP 400',
      title: 'Invoice Reference Required',
      paragraphs: [
        'No invoice, batch statement, or unpaid bill reference was included in this link.',
        'Open Payments & Invoices from your dashboard to select and download a statement.',
      ],
      primaryAction: {
        label: isDentist && !portal.isGuest ? 'Go to My Invoices' : 'Sign In to Dentzy',
        href: isDentist && !portal.isGuest ? portal.paymentsHref : '/login',
      },
      secondaryAction:
        isDentist && !portal.isGuest
          ? { label: 'Call Lab Desk', href: LAB_SUPPORT_PHONE_HREF, external: true }
          : { label: 'Return to Home', href: '/' },
    };
  }

  // 500 / network error / fallback
  if (isLab) {
    const labActions = buildLabBillingAction(portal);
    return {
      eyebrow: `${eyebrowPrefix}${eyebrowStatus}`,
      title: error?.title || 'Failed to Load Invoice',
      paragraphs: [
        error?.message || 'An error occurred while retrieving the invoice record from the lab server.',
        'Retry loading this statement or verify server / ledger status from the Lab Dashboard.',
      ],
      primaryAction: { label: 'Try Again', type: 'reload' },
      secondaryAction: labActions.primary,
    };
  }

  return {
    eyebrow: `Invoice${eyebrowStatus}`,
    title: error?.title || 'Failed to Load Invoice',
    paragraphs: [
      error?.message || 'An error occurred while retrieving the invoice record.',
      'Try reloading this page, or contact Dentzy Lab Desk (+91 95036 68112) if the issue persists.',
    ],
    primaryAction: { label: 'Try Again', type: 'reload' },
    secondaryAction:
      isDentist && !portal.isGuest
        ? { label: 'Go to My Invoices', href: portal.paymentsHref }
        : { label: 'Return to Home', href: '/' },
  };
}

/**
 * Returns POV-aware content for Next.js app/not-found.jsx.
 */
export function getNotFoundConfig(portal) {
  if (portal?.pov === 'lab' && !portal.isGuest) {
    return {
      eyebrow: 'Lab Portal · HTTP 404',
      title: 'Lab Page Not Found',
      paragraphs: [
        "This internal route doesn't exist or belongs to a different staff / executive permission level.",
        'Return to your Lab Dashboard to manage dentists, cases, and billing.',
      ],
      primaryAction: {
        label: portal.backLabel.replace(/^Back to /, 'Open '),
        href: portal.backHref,
      },
      secondaryAction:
        portal.paymentsHref !== portal.backHref
          ? { label: 'Payments & Billing', href: portal.paymentsHref }
          : null,
    };
  }

  if (portal?.pov === 'dentist' && !portal.isGuest) {
    return {
      eyebrow: 'Clinical Portal · HTTP 404',
      title: 'Page Not Found',
      paragraphs: [
        "This Clinical Portal page doesn't exist or isn't enabled for your clinic account.",
        'Return to your dashboard to track active lab cases and invoices.',
      ],
      primaryAction: { label: 'Back to Dashboard', href: '/dashboard' },
      secondaryAction: { label: 'View My Orders', href: '/dashboard?tab=orders' },
    };
  }

  return {
    eyebrow: 'Dentzy · HTTP 404',
    title: 'Page Not Found',
    paragraphs: [
      'This page may not exist, or you may need to sign in with the right Dentzy account.',
      'Choose your portal below or return to the Dentzy home page.',
    ],
    primaryAction: { label: 'Return to Home', href: '/' },
    secondaryAction: { label: 'Dentist Login', href: '/login' },
  };
}

/**
 * Returns POV-aware content for Next.js app/error.jsx.
 */
export function getRootErrorConfig({ portal, refId }) {
  if (portal?.pov === 'lab') {
    return {
      eyebrow: `Lab Portal · Reference ${refId}`,
      title: 'Lab view hit a technical issue',
      paragraphs: [
        'An unexpected rendering error occurred in the Lab Portal. Lab orders and ledger records have not been affected.',
        'Try reloading the view, or return to your Lab Dashboard.',
      ],
      secondaryAction: {
        label: portal.isGuest ? 'Lab Login' : portal.backLabel.replace(/^Back to /, 'Open '),
        href: portal.isGuest ? portal.loginHref : portal.backHref,
      },
    };
  }

  if (portal?.pov === 'dentist' && !portal.isGuest) {
    return {
      eyebrow: `Clinical Portal · Reference ${refId}`,
      title: 'We hit a technical issue',
      paragraphs: [
        'An unexpected error occurred while loading your clinic view. Your patient cases and invoices are safe.',
        'Try reloading this view, or return to your Clinical Dashboard.',
      ],
      secondaryAction: { label: 'Back to Dashboard', href: '/dashboard' },
    };
  }

  return {
    eyebrow: `Something went wrong · Reference ${refId}`,
    title: 'We hit a technical issue',
    paragraphs: [
      'An unexpected error occurred while loading this view. Your data has not been affected.',
      'Try loading the view again, or sign in to your Dentzy portal.',
    ],
    secondaryAction: { label: 'Go to Login', href: '/login' },
  };
}
