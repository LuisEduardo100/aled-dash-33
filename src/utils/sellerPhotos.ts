// Mapping of seller names to their photo paths
// Names should match exactly as they appear in Bitrix data

export interface SellerPhoto {
    path: string;
    name: string;
}

// Available photos in /public/vendedores/
const SELLER_PHOTOS: Record<string, string> = {
    'aderucia': '/vendedores/aderucia.png',
    'matheus martins': '/vendedores/matheus_martins.jpg',
    'paulo cesar': '/vendedores/paulo_cesar.png',
    'raquel': '/vendedores/raquel.png',
    'renato campos': '/vendedores/renato_campos.png',
    'yuri': '/vendedores/yuri.png',
};

// Default monthly goals per seller (can be updated by manager)
const DEFAULT_MONTHLY_GOALS: Record<string, number> = {
    'default': 100000, // R$ 100k default goal
};

/**
 * Get seller photo path by name
 * Returns null if no photo exists for the seller
 */
export function getSellerPhoto(name: string): string | null {
    const normalizedName = name.toLowerCase().trim();

    // Try exact match first
    if (SELLER_PHOTOS[normalizedName]) {
        return SELLER_PHOTOS[normalizedName];
    }

    // Try partial match (first name)
    const firstName = normalizedName.split(' ')[0];
    if (SELLER_PHOTOS[firstName]) {
        return SELLER_PHOTOS[firstName];
    }

    // Try matching any key that contains the first name
    for (const [key, path] of Object.entries(SELLER_PHOTOS)) {
        if (key.includes(firstName) || firstName.includes(key)) {
            return path;
        }
    }

    return null;
}

/**
 * Get monthly goal for a seller
 * Goals are stored in localStorage and can be updated by manager
 */
export function getSellerMonthlyGoal(sellerName: string): number {
    const storageKey = 'sellerMonthlyGoals';
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const goals = JSON.parse(stored);
            const normalizedName = sellerName.toLowerCase().trim();
            if (goals[normalizedName]) {
                return goals[normalizedName];
            }
        }
    } catch {
        // Ignore storage errors
    }

    // Return default goal
    const normalizedName = sellerName.toLowerCase().trim();
    return DEFAULT_MONTHLY_GOALS[normalizedName] || DEFAULT_MONTHLY_GOALS['default'];
}

/**
 * Set monthly goal for a seller
 * Saves to localStorage
 */
export function setSellerMonthlyGoal(sellerName: string, goal: number): void {
    const storageKey = 'sellerMonthlyGoals';
    try {
        const stored = localStorage.getItem(storageKey);
        const goals = stored ? JSON.parse(stored) : {};
        const normalizedName = sellerName.toLowerCase().trim();
        goals[normalizedName] = goal;
        localStorage.setItem(storageKey, JSON.stringify(goals));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Get all seller goals from localStorage
 */
export function getAllSellerGoals(): Record<string, number> {
    const storageKey = 'sellerMonthlyGoals';
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Ignore storage errors
    }
    return {};
}
