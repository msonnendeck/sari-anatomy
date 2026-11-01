// Shared allowlist for model-proposed, reversible workspace actions.
export function validAction(a, context = {}) {
  if (!a || typeof a !== 'object') return false;
  const axes = ['axial','coronal','sagittal'];
  if (a.action === 'select_region') return Number.isInteger(a.regionId) && context.atlasRegions?.some(r => r.id === a.regionId);
  if (a.action === 'set_axis') return axes.includes(a.axis);
  if (a.action === 'set_slice') {
    const dim = {sagittal:0,coronal:1,axial:2}[a.axis];
    return axes.includes(a.axis) && Number.isInteger(a.slice) && a.slice >= 0 && a.slice < (context.dims?.[dim] || 0);
  }
  if (a.action === 'set_view') return ['atlas','solid','volume'].includes(a.mode) && (a.mode !== 'atlas' || !!context.atlasRegions?.length) && (a.hemisphere === undefined || ['both','left','right'].includes(a.hemisphere)) && typeof a.isolate === 'boolean';
  if (a.action === 'set_cut') return (a.enabled === undefined || typeof a.enabled === 'boolean') && Number.isFinite(a.pitch) && Math.abs(a.pitch)<=90 && Number.isFinite(a.yaw) && Math.abs(a.yaw)<=180;
  return ['worst_difference','show_reference','show_proposal'].includes(a.action);
}
export function conversationHistory(history) {
  return (Array.isArray(history) ? history : []).filter(m => ['user','assistant'].includes(m?.role) && typeof m.text === 'string').slice(-8).map(m => ({role:m.role,content:m.text.slice(0,2000)}));
}
