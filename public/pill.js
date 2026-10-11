// "Live room" pill on every phone/desktop page.
const a = document.createElement("a");
a.href = "/world"; a.target = "_blank"; a.textContent = "● Live room →";
a.style.cssText = "position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:99;background:#fff3d6;color:#3a2416;border:2px solid #3a2416;border-radius:999px;padding:5px 12px;font:700 14px 'Marker Felt','Chalkboard SE',ui-rounded,system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 0 rgba(58,36,22,.6)";
document.body.append(a);
