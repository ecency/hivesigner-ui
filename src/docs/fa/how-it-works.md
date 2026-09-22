Hivesigner به افراد اجازه می‌دهد از حساب Hive خود در برنامه شما استفاده کنند، بدون آنکه کلیدهایشان را به برنامه شما بدهند. دو بخش دارد: یک امضاکننده در مرورگر روی https://hivesigner.com و یک API روی `https://hivesigner.com/api/`. این صفحه توضیح می‌دهد هر بخش چه می‌کند و یک برنامه به دو شیوه از آنها استفاده می‌کند.

## امضاکننده در مرورگر {#browser-signer}

امضاکننده در مرورگر همان وب‌سایت Hivesigner است. افراد حساب‌های Hive خود را آنجا اضافه می‌کنند. کلیدهایشان در مرورگر خودشان می‌ماند: Hivesigner هیچ کلیدی را به هیچ سروری نمی‌فرستد. برنامه شما هرگز کلیدی نمی‌بیند.

امضاکننده سه نوع چیز را امضا می‌کند، هر بار پس از آنکه کاربر دیده است چه چیزی را امضا می‌کند:

- **توکن‌های ورود.** برنامه شما کسی را برای ورود به Hivesigner می‌فرستد. Hivesigner نام برنامه شما و آنچه می‌خواهد را نشان می‌دهد. وقتی کاربر تأیید کند، Hivesigner با کلید او بیانیه‌ای کوتاه امضا می‌کند که نام حساب او و برنامه شما را در خود دارد. همان بیانیه امضاشده، توکنی است که برنامه شما دریافت می‌کند. ببینید [ورود با OAuth2](/docs/oauth2) و [توکن‌ها](/docs/tokens).
- **تراکنش‌ها.** یک پیوند امضا، تراکنشی را برای بررسی باز می‌کند. وقتی کاربر تأیید کند، Hivesigner آن را با کلید لازم امضا می‌کند. سپس آن را از مرورگر به شبکه Hive می‌فرستد، مگر آنکه پیوند فقط امضا را بخواهد. ببینید [پیوندهای امضا](/docs/sign-links).
- **پیام‌ها.** برنامه شما می‌تواند از کاربر بخواهد متنی را با کلید خود امضا کند تا ثابت کند حساب را در اختیار دارد. ببینید [امضای پیام](/docs/message-signing).

## API {#api}

API عملیات انتشار را به‌جای کاربری که به برنامه شما وارد شده منتشر می‌کند: پست‌ها و دیدگاه‌ها، رأی‌ها، دنبال‌کردن‌ها و دیگر عملیات `custom_json`، دریافت پاداش‌ها و به‌روزرسانی پروفایل. برنامه شما عملیات را همراه با توکن کاربر می‌فرستد. API توکن را بررسی می‌کند، تراکنش را با کلید انتشار حساب @hivesigner امضا می‌کند و آن را به Hive می‌فرستد.

API همچنین حساب کاربر واردشده را برمی‌گرداند، کدها را با توکن مبادله می‌کند و برنامه‌هایی را که از Hivesigner استفاده می‌کنند فهرست می‌کند. ببینید [REST API](/docs/api).

## زنجیره اختیار انتشار {#authority-chain}

در Hive یک حساب می‌تواند به حساب دیگری اجازه دهد با اختیار انتشار او عمل کند. API به دو مورد از این اجازه‌ها تکیه دارد:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **کاربر حساب برنامه شما را به اختیار انتشار خود اضافه می‌کند.** صفحه رضایت این کار را نخستین باری که کاربری دسترسی انتشار را برای برنامه شما تأیید می‌کند انجام می‌دهد. این کار یک بار به کلید فعال کاربر نیاز دارد.
2. **حساب برنامه شما @hivesigner را به اختیار انتشار خود اضافه می‌کند.** این کار را یک بار انجام می‌دهید، هنگامی که [برنامه خود را ثبت می‌کنید](/docs/register-app#grant-hivesigner).

API پیش از انتشار بررسی می‌کند که هر دو اجازه برقرار باشند. تنها عملیاتی را منتشر می‌کند که نویسنده‌شان همان کاربری باشد که توکن نام می‌برد.

کاربر هر زمان می‌تواند دسترسی برنامه شما را در https://hivesigner.com/authorized-apps بردارد. پس از آن، API دیگر نمی‌تواند از راه برنامه شما به‌جای او پست بگذارد.

## دو شیوه یکپارچه‌سازی {#two-ways-to-integrate}

### ورود، سپس انتشار از راه API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

کاربر یک بار تأیید می‌کند. پس از آن برنامه شما می‌تواند بدون پرسیدن دوباره به‌جای او رأی دهد، دیدگاه بنویسد و پست بگذارد، تا زمانی که توکن منقضی شود یا کاربر دسترسی برنامه شما را بردارد. این شیوه را برای کارهای اجتماعی روزمره به کار ببرید.

به یک حساب برنامه با نشانی‌های بازگشت ثبت‌شده و اجازه @hivesigner نیاز دارید. ببینید [برنامه خود را ثبت کنید](/docs/register-app). اگر فقط می‌خواهید بدانید کاربر کیست، ببینید [ورود بدون دسترسی انتشار](/docs/login-only).

### پیوندهای امضا {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

کاربر هر تراکنش را پیش از امضا می‌بیند. پیوندهای امضا ۴۱ عملیات Hive را پوشش می‌دهند، از جمله انتقال‌ها و دیگر کارهای کیف پول که به کلید فعال نیاز دارند. API هرگز آنها را انجام نمی‌دهد. برای پیوندهای امضا به حساب برنامه نیاز ندارید. ببینید [پیوندهای امضا](/docs/sign-links).

### کدام را انتخاب کنیم {#which-to-choose}

- **کارهای پرتکرار انتشار** (رأی، دیدگاه، دنبال‌کردن): با OAuth2 وارد شوید و سپس از API استفاده کنید.
- **کارهای کیف پول**، یا هر چیزی که به کلید فعال نیاز دارد: از پیوندهای امضا استفاده کنید.
- **هر دو**: بسیاری از برنامه‌ها افراد را برای امکانات اجتماعی با OAuth2 وارد می‌کنند و برای انتقال‌ها از پیوندهای امضا استفاده می‌کنند.
- **فقط هویت کاربر**: ببینید [ورود بدون دسترسی انتشار](/docs/login-only).

## کد منبع {#source-code}

Hivesigner متن‌باز است:

- امضاکننده در مرورگر: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- کیت توسعه JavaScript (بسته npm با نام `hivesigner`): https://github.com/ecency/hivesigner-sdk. ببینید [کیت‌های توسعه](/docs/sdk).
