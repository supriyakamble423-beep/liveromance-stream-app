# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use (stable बेहतर है production के लिए)
  channel = "stable-24.11";

  # Packages जो workspace में install होंगे
  packages = [
    pkgs.nodejs_20          # Node.js v20 (Next.js 15 के लिए compatible)
    pkgs.zulu               # Java (अगर Genkit या अन्य Java tools यूज कर रहे हो)
    pkgs.busybox            # ← fuser, kill, ps, netstat जैसे tools के लिए (port kill करने में मदद करेगा)
    pkgs.coreutils          # basic utils (ls, cat, etc. को मजबूत बनाने के लिए)
  ];

  # Environment variables (अगर जरूरत हो तो ऐड करो)
  env = {
    # PORT = "9003";  # optional – previews में override होता है
  };

  # Firebase emulators (अभी disable रखा है क्योंकि तुम prod backend यूज कर रहे हो)
  services.firebase.emulators = {
    detect = false;
    projectId = "demo-app";  # अपना real project ID डाल सकते हो अगर emulators यूज करना हो
    services = [ "auth" "firestore" "storage" "functions" ];  # जरूरत के हिसाब से ऐड करो
  };

  # IDX (Firebase Studio) specific config
  idx = {
    # VS Code extensions (open-vsx.org से ID ले सकते हो)
    extensions = [
      # "vscodevim.vim"               # optional
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "ms-vscode.vscode-typescript-next"
    ];

    workspace = {
      onCreate = {
        # Startup पर कौन सी files open हों
        default.openFiles = [
          "src/app/page.tsx"
          "src/app/stream/simulate_host/page.tsx"  # तुम्हारा main page
        ];
      };
    };

    # Previews configuration (web preview)
    previews = {
      enable = true;
      previews = {
        web = {
          # Next.js dev server को 0.0.0.0 पर चलाओ ताकि Studio preview में दिखे
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
          # Optional: env vars for preview
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}