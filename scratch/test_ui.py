import sys
import time
from playwright.sync_api import sync_playwright

def test_codak():
    print("Iniciando validação do Codak RPG...")
    has_errors = False
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Escuta erros no console do navegador
        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(err))
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("Navegando para http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 1. Verificar tela de login
        print("Preenchendo credenciais do jogador...")
        page.fill("#login-username", "jogador")
        page.fill("#login-password", "player123")
        page.click("#btn-login-submit")
        
        page.wait_for_load_state("networkidle")
        time.sleep(2)  # Aguardar animações de login

        # Verificar se fez login com sucesso
        header_text = page.locator("#header-username").inner_text()
        print(f"Login efetuado. Cabeçalho: {header_text}")
        if "jogador" not in header_text.lower():
            print("ERRO: Falha ao efetuar login.")
            has_errors = True

        # 2. Tela de Sessão (Index 0)
        print("Verificando Central de Operações (Lobby)...")
        # Deve ter o botão do Tabletop
        btn_tabletop = page.locator("#btn-session-mode-tabletop")
        if btn_tabletop.is_visible():
            print("Botão Tabletop visível. Trocando para tabletop...")
            btn_tabletop.click()
            time.sleep(1)
            # Verificar se a grelha de tabletop está visível
            tabletop_view = page.locator("#session-tabletop-view")
            if tabletop_view.is_visible():
                print("Tabletop visível. Rolando dados...")
                page.locator(".btn-roll-dice").first.click()
                time.sleep(0.5)
                res_val = page.locator("#dice-roll-result").inner_text()
                print(f"Resultado do dado: {res_val}")
                if res_val == "--":
                    print("ERRO: Rolagem de dados falhou.")
                    has_errors = True
            else:
                print("ERRO: Painel Tabletop não abriu.")
                has_errors = True
        else:
            print("ERRO: Botão de alternar sessão ausente.")
            has_errors = True

        # 3. Tela de Campanhas (Index 1)
        print("Navegando para Campanhas...")
        page.locator(".nav-item[data-index='1']").click()
        time.sleep(1.5)
        
        # Verificar se os cards de campanha renderizaram
        camp_cards = page.locator(".campaign-card")
        count = camp_cards.count()
        print(f"Encontradas {count} campanhas.")
        if count == 0:
            print("ERRO: Nenhum card de campanha carregado.")
            has_errors = True
        else:
            print("Abrindo primeira campanha...")
            camp_cards.first.click()
            time.sleep(1)
            # Popup deve estar visível
            popup = page.locator("#campaign-popup-overlay")
            if popup.is_visible():
                print("Popup de campanha aberto. Verificando party...")
                # Deve listar jogadores
                players = page.locator(".party-player-row")
                print(f"Jogadores encontrados no popup: {players.count()}")
                if players.count() > 0:
                    print("Clicando no primeiro jogador para ver a ficha...")
                    players.first.click()
                    time.sleep(1)
                    # Tela da ficha deve abrir
                    char_screen = page.locator("#popup-screen-character")
                    if char_screen.is_visible():
                        print("Ficha do jogador carregada no popup.")
                        # Voltar
                        page.locator("#btn-popup-char-back").click()
                        time.sleep(0.5)
                        if page.locator("#popup-screen-campaign").is_visible():
                            print("Voltou para a campanha com sucesso.")
                        else:
                            print("ERRO: Botão Voltar falhou.")
                            has_errors = True
                    else:
                        print("ERRO: Ficha do jogador não carregou.")
                        has_errors = True
                
                # Fechar popup
                page.locator("#btn-close-campaign-popup").click()
                time.sleep(0.5)
                if popup.is_hidden():
                    print("Popup fechado com sucesso.")
                else:
                    print("ERRO: Fechamento de popup falhou.")
                    has_errors = True
            else:
                print("ERRO: Popup de campanha não apareceu.")
                has_errors = True

        # 4. Tela de Personagens (Index 2)
        print("Navegando para Personagens...")
        page.locator(".nav-item[data-index='2']").click()
        time.sleep(1.5)

        # Deve conter classes na lista lateral CoD style
        cod_classes = page.locator(".cod-class-item")
        print(f"Classes listadas no seletor CoD: {cod_classes.count()}")
        if cod_classes.count() == 0:
            print("ERRO: Nenhuma classe renderizada no seletor CoD.")
            has_errors = True
        else:
            # Selecionar o segundo boneco
            print("Selecionando segundo boneco...")
            cod_classes.nth(1).click()
            time.sleep(1)
            name = page.locator("#char-spec-name").inner_text()
            print(f"Nome do boneco selecionado: {name}")
            
            # Verificar se os atributos e HP estão preenchidos
            hp_val = page.locator("#char-hp-text").inner_text()
            print(f"HP do boneco: {hp_val}")
            if "0/0" in hp_val or hp_val == "":
                print("ERRO: HP não foi preenchido.")
                has_errors = True
                
            # Entrar no modo de mochila
            print("Alternando para edição de mochila...")
            page.locator("#btn-char-mode-toggle").click()
            time.sleep(0.5)
            # Mochila deve estar visível
            mochila = page.locator("#char-inventory-edit-panel")
            if mochila.is_visible():
                print("Modo Mochila ativo.")
                # Deve listar itens na mochila
                items = page.locator("#player-inventory-list .scroll-list-item")
                print(f"Itens na mochila: {items.count()}")
                if items.count() > 0:
                    print("Mochila preenchida com sucesso.")
                else:
                    print("ERRO: Mochila está vazia.")
                    has_errors = True
                
                # Voltar para a ficha
                page.locator("#btn-char-mode-toggle").click()
                time.sleep(0.5)
                if page.locator("#char-stats-view-panel").is_visible():
                    print("Retornou para ficha com sucesso.")
                else:
                    print("ERRO: Falha ao retornar para ficha.")
                    has_errors = True
            else:
                print("ERRO: Mochila não abriu.")
                has_errors = True

        # 5. Tela de Compêndio (Index 3)
        print("Navegando para Compêndio...")
        page.locator(".nav-item[data-index='3']").click()
        time.sleep(1.5)

        # Deve conter itens do compêndio na lista lateral
        comp_items = page.locator(".db-list-item")
        print(f"Itens listados no Compêndio: {comp_items.count()}")
        if comp_items.count() == 0:
            print("ERRO: Nenhum item renderizado no Compêndio.")
            has_errors = True
        else:
            # Verificar se os detalhes do primeiro item foram renderizados
            details = page.locator("#compendium-details-text").inner_text()
            print(f"Detalhes do primeiro item:\n{details[:120]}...")
            if "CLASSIFIED SPECIFICATION REPORT" not in details:
                print("ERRO: Detalhes do compêndio não formatados em modo terminal.")
                has_errors = True

        # Verificar logs de erro
        if len(console_errors) > 0:
            print("\nERROS DE JAVASCRIPT ENCONTRADOS NO CONSOLE:")
            for err in console_errors:
                print(f"  - {err}")
            has_errors = True
        else:
            print("\nNenhum erro de console detectado!")

        browser.close()
        
    if has_errors:
        print("\nVALIDAÇÃO FALHOU!")
        sys.exit(1)
    else:
        print("\nVALIDAÇÃO CONCLUÍDA COM SUCESSO!")
        sys.exit(0)

if __name__ == "__main__":
    test_codak()
