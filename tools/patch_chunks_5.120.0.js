const fs = require('fs');
const path = require('path');

console.log('=== APPLYING COMPREHENSIVE PLUS & AUTH PATCHES (5.120.0) ===');

function patchFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const [target, replacement] of replacements) {
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      count++;
    } else {
      console.warn(`[WARN] Target not found in ${path.basename(filePath)}:\n  ${target.substring(0, 80)}...`);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${path.basename(filePath)}: applied ${count} / ${replacements.length} patches.`);
}

function applyPatches(targetDir) {
  console.log(`\nPatching directory: ${targetDir}`);
  const chunksDir = path.join(targetDir, 'app', '_next', 'static', 'chunks');

  // 1. Chunk 9712: UserModel, FreeAccess, FreePlayerAccess, getAbout action
  const chunk9712Path = path.join(chunksDir, '9712-8122808d589b06b5.js');
  const oldGetAbout = 'getAbout:(0,f.L3)(function*(t){let{accountResource:a,modelActionsLogger:i,containerStorage:l}=(0,f._$)(e);if(!e.account.isLoading)try{e.account.loadingState=eI.G.PENDING;let i=t;i||(i=yield a.about()),l.set(rF.c.YmUid,i.uid),e.account.data=(e=>{let t=e.options?e.options.filter(e=>"string"==typeof e):void 0;return(0,f.wg)({uid:e.uid,login:e.login,avatarId:e.avatarId,hasPlus:e.hasPlus,publicId:e.publicId,publicName:e.publicName,isChild:e.isChild,userSessionRegionIso:e.userSessionRegionIso,geoRegionIso:e.geoRegionIso,serviceAvailable:e.serviceAvailable,options:t})})(i),e.account.loadingState=eI.G.RESOLVE,(0,g7.uV)({stage:"account-about",result:(0,g7.UC)(i)})}catch(t){(0,g7.uV)({stage:"account-about",result:(0,g7.dM)(t)}),i.error(t),e.account.loadingState=eI.G.REJECT}}),';
  const newGetAbout = 'getAbout:(0,f.L3)(function*(t){let{accountResource:a,modelActionsLogger:i,containerStorage:l}=(0,f._$)(e);if(!e.account.isLoading)try{e.account.loadingState=eI.G.PENDING;let i=t;try{i||(i=yield a.about())}catch(err){i={}}i&&i.result&&(i=i.result),i=i||{},i.hasPlus=!0,i.serviceAvailable=!0,i.options=i.options||["plus"],i.uid=i.uid||l.get(rF.c.YmUid)||12345678,l.set(rF.c.YmUid,i.uid),e.account.data=(e=>{let t=e.options?e.options.filter(e=>"string"==typeof e):void 0;return(0,f.wg)({uid:e.uid,login:e.login||"yandex_user",avatarId:e.avatarId,hasPlus:!0,publicId:e.publicId,publicName:e.publicName,isChild:e.isChild,userSessionRegionIso:e.userSessionRegionIso||"RU",geoRegionIso:e.geoRegionIso||"RU",serviceAvailable:!0,options:t||["plus"]})})(i),e.account.loadingState=eI.G.RESOLVE,(0,g7.uV)({stage:"account-about",result:"authorized"})}catch(t){let u=l.get(rF.c.YmUid)||12345678;e.account.data=(0,f.wg)({uid:Number(u),login:"yandex_user",hasPlus:!0,serviceAvailable:!0,options:["plus"]}),e.account.loadingState=eI.G.RESOLVE,(0,g7.uV)({stage:"account-about",result:"authorized"})}}),';

  const oldFreeAccess = 'model("FreeAccess").views(e=>{let t={get isFreeDesktopUser(){let{user:t}=(0,C.M)(e);return!t.hasPlus},get isFreeWebUser(){let{user:t}=(0,C.M)(e);return!t.hasPlus&&!1},get isFreeUser(){return t.isFreeDesktopUser||t.isFreeWebUser},get isFreePlaybackDisabled(){var a,i,l;let{user:t,settings:r,experiments:s}=(0,C.M)(e);return!t.hasPlus&&(null==(i=s.getExperiment(R.z.WebNextDesktopWebFreemium))||null==(a=i.value)?void 0:a.closeListening)==="on"&&!(null==(l=r.browserInfo)?void 0:l.isTouch)&&t.isAuthorized},get limitedFreePlayback(){var r,s,n;let{user:t,settings:a,experiments:i}=(0,C.M)(e);return!t.hasPlus&&(null==(s=i.getExperiment(R.z.WebNextDesktopWebFreemium))||null==(r=s.value)?void 0:r.limitListening)==="on"&&!(null==(n=a.browserInfo)?void 0:n.isTouch)&&t.isAuthorized},get isVibeStartRestricted(){return t.isFreeWebUser||t.isFreePlaybackDisabled},get isSearchVibeStartRestricted(){return t.isFreePlaybackDisabled}};return t})';
  const newFreeAccess = 'model("FreeAccess").views(e=>{let t={get isFreeDesktopUser(){return!1},get isFreeWebUser(){return!1},get isFreeUser(){return!1},get isFreePlaybackDisabled(){return!1},get limitedFreePlayback(){return!1},get isVibeStartRestricted(){return!1},get isSearchVibeStartRestricted(){return!1}};return t})';

  patchFile(chunk9712Path, [
    ['get hasPlus(){return!!e.account.data.hasPlus}', 'get hasPlus(){return!0}'],
    ['get advertRole(){if(!this.isAuthorized)return g8.UNAUTHORIZED;if(this.hasPlus)return g8.PLUS;return g8.NON_PLUS}', 'get advertRole(){return g8.PLUS}'],
    ['get isServiceAvailable(){var t;return null==(t=e.account.data.serviceAvailable)||t}', 'get isServiceAvailable(){return!0}'],
    ['showRestrictionModal(t){let{user:a,freeAccess:i,fullscreenPlayer:l,sonataState:r}=(0,C.M)(e);if(t===nH.W.Playing&&r.isGenerativeContext){e.restrictionModal=void 0;return}if(!a.isAuthorized){e.restrictionModal=l.modal.isOpened?nJ.h.FullscreenUnauthorized:nJ.h.PlayerAuthorization;return}if(!(t===nH.W.Playing?i.isFreeDesktopUser||i.limitedFreePlayback:i.isFreeWebUser)){e.restrictionModal=void 0;return}e.restrictionModal=l.modal.isOpened?nJ.h.FullscreenSubscription:nJ.h.PlayerSubscription}', 'showRestrictionModal(t){e.restrictionModal=void 0;return}'],
    [oldFreeAccess, newFreeAccess],
    [oldGetAbout, newGetAbout]
  ]);

  // 2. Chunk 5283: isPlusSubscribed
  const chunk5283Path = path.join(chunksDir, '5283-780dc69f5fa0b981.js');
  if (fs.existsSync(chunk5283Path)) {
    patchFile(chunk5283Path, [
      ['get isPlusSubscribed(){if(!(0,r._n)(e))return!1;let{user:i}=(0,l.M)(e);return i.hasPlus}', 'get isPlusSubscribed(){return!0}']
    ]);
  }

  // 3. Chunk 6881: isPlusSubscribed
  const chunk6881Path = path.join(chunksDir, '6881-481b09c63bccb9e5.js');
  if (fs.existsSync(chunk6881Path)) {
    patchFile(chunk6881Path, [
      ['get isPlusSubscribed(){if(!(0,r._n)(e))return!1;let{user:t}=(0,s.M)(e);return t.hasPlus}', 'get isPlusSubscribed(){return!0}']
    ]);
  }

  // 4. Chunk 5833: customDuration cap (29s preview) removal
  const chunk5833Path = path.join(chunksDir, '5833.ce1113149fa85074.js');
  if (fs.existsSync(chunk5833Path)) {
    patchFile(chunk5833Path, [
      ['customDuration:(null==n?void 0:n.isAuthorized)&&!o.isFreeDesktopUser?void 0:29', 'customDuration:void 0']
    ]);
  }
}

// Apply to unpacked_app_5.120.0
applyPatches('D:\\Desktop\\yandex\\unpacked_app_5.120.0');
