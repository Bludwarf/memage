# Installation (version Robot-JS)

[RobotJS][1] ne supporte pas plus loin que Node 8.

```
nvm install 8.15.0
nvm use 8.15.0
```

Suivre ensuite [ce commentaire][2].

# Installation (version MemoryJS)

Version d'Electron : 4.0.6 => Version Node : 10.11.0

```
nvm install 10.11.0 32
nvm use 10.11.0 32
npm install
```

# Dev

## Migrer Electron

Changer :

- .npmrc
- package.json
- readme.md section Installation (version de Node utilisée par Electron)

[1]: http://getrobot.net/docs/node.html
[2]: https://github.com/Robot/robot-js/pull/20#issuecomment-315207337
