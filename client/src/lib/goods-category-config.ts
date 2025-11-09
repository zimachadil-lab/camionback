import { LucideIcon, Truck, Sofa, Home, Boxes, ShoppingCart, Package, Wrench, Car } from 'lucide-react';

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

export const getCategoryConfig = (goodsType: string, t: any): CategoryConfig => {
  const type = goodsType.toLowerCase();
  
  const categoryKeyMap: Record<string, { icon: LucideIcon; color: string; bgColor: string; borderColor: string; translationKey: string }> = {
    'furniture': {
      icon: Sofa,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      borderColor: 'border-blue-500',
      translationKey: 'shared.goodsTypes.furniture'
    },
    'moving': {
      icon: Home,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-500',
      translationKey: 'shared.goodsTypes.moving'
    },
    'construction': {
      icon: Boxes,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      borderColor: 'border-orange-500',
      translationKey: 'shared.goodsTypes.construction'
    },
    'goods': {
      icon: ShoppingCart,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      borderColor: 'border-pink-500',
      translationKey: 'shared.goodsTypes.goods'
    },
    'parcel': {
      icon: Package,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
      borderColor: 'border-amber-500',
      translationKey: 'shared.goodsTypes.parcel'
    },
    'appliances': {
      icon: Wrench,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-500',
      translationKey: 'shared.goodsTypes.appliances'
    },
    'vehicle': {
      icon: Car,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      borderColor: 'border-cyan-500',
      translationKey: 'shared.goodsTypes.vehicle'
    }
  };
  
  const frTranslations: Record<string, string> = {
    'meubles': 'furniture',
    'mobilier': 'furniture',
    'meuble': 'furniture',
    'أثاث': 'furniture',
    'déménagement': 'moving',
    'نقل': 'moving',
    'matériaux': 'construction',
    'construction': 'construction',
    'مواد بناء': 'construction',
    'marchandises': 'goods',
    'marchandise': 'goods',
    'produits': 'goods',
    'produit': 'goods',
    'بضائع': 'goods',
    'colis': 'parcel',
    'طرد': 'parcel',
    'électroménager': 'appliances',
    'équipement': 'appliances',
    'أجهزة': 'appliances',
    'أجهزة كهرومنزلية': 'appliances',
    'véhicule': 'vehicle',
    'مركبة': 'vehicle'
  };
  
  let categoryKey: string | null = null;
  for (const [searchTerm, key] of Object.entries(frTranslations)) {
    if (type.includes(searchTerm.toLowerCase())) {
      categoryKey = key;
      break;
    }
  }
  
  if (categoryKey && categoryKeyMap[categoryKey]) {
    const config = categoryKeyMap[categoryKey];
    return {
      ...config,
      label: t(config.translationKey)
    };
  }
  
  return {
    icon: Truck,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
    borderColor: 'border-slate-500',
    label: goodsType
  };
};
