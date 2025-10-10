{ pkgs, ... }:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = [ pkgs.git pkgs.biome pkgs.nil ];

  # https://devenv.sh/languages/
  languages.typescript.enable = true;
  languages.javascript.bun.enable = true;
  languages.javascript.bun.install.enable = true;

  # https://devenv.sh/processes/
  # processes.cargo-watch.exec = "cargo-watch";

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  # https://devenv.sh/scripts/
  scripts.hello.exec = ''
    git --version
    bun --version
    git log --oneline -n 5
  '';

  scripts.fix.exec = ''
    biome check --write
  '';

  scripts.dev.exec = ''
    cd murhakaverit-magic-manual && bun run dev
  '';

  scripts.build.exec = ''
    cd murhakaverit-magic-manual && bun run build
  '';

  scripts.run.exec = ''
    cd murhakaverit-magic-manual && bun run start
  '';

  enterShell = ''
    hello
    biome lint
  '';

  # https://devenv.sh/tasks/
  # tasks = {
  #   "myproj:setup".exec = "mytool build";
  #   "devenv:enterShell".after = [ "myproj:setup" ];
  # };

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # https://devenv.sh/git-hooks/
  git-hooks.hooks.biome.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
