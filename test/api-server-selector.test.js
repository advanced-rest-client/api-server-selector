import { fixture, assert, nextFrame, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { AmfLoader } from './amf-loader.js';
import { AmfHelper } from './amf-helper.js';
import '../api-server-selector.js';

describe('<api-server-selector>', () => {
  async function basicFixture(amf) {
    return (await fixture(html`<api-server-selector .amf="${amf}"></api-server-selector>`));
  }

  async function allowCustomFixture(amf) {
    return (await fixture(html`<api-server-selector .amf="${amf}" allowCustom></api-server-selector>`));
  }

  async function customInputFixture() {
    return (await fixture(`<api-server-selector
      allowcustom
      type="custom"
    ></api-server-selector>`));
  }

  async function extraOptionsFixture(amf) {
    return (await fixture(html`
      <api-server-selector .amf="${amf}">
        <anypoint-item slot="custom-base-uri" value="http://customServer.com">
          http://customServer.com
        </anypoint-item>
        <anypoint-item slot="custom-base-uri" value="http://customServer2.com">
          http://customServer2.com
        </anypoint-item>
    </api-server-selector>`));
  }
  async function slotChangeFixture() {
    return (await fixture(`
      <api-server-selector>
        <anypoint-item slot="custom-base-uri" value="http://customServer.com">
          http://customServer.com
        </anypoint-item>
        <anypoint-item slot="custom-base-uri" value="http://customServer2.com">
          http://customServer2.com
        </anypoint-item>
        <anypoint-item value="http://customServer3.com">
          http://customServer3.com
        </anypoint-item>
    </api-server-selector>`));
  }

  async function baseUriFixture() {
    return (await fixture(`<api-server-selector allowCustom baseUri="https://www.google.com"></api-server-selector>`));
  }

  async function compatibilityFixture() {
    return (await fixture(`<api-server-selector
      allowCustom
      compatibility
      ></api-server-selector>`));
  }

  async function outlinedFixture() {
    return (await fixture(`<api-server-selector
      allowCustom
      outlined
      >
      </api-server-selector>`));
  }

  async function autoSelectFixture(amf) {
    return (await fixture(html`
      <api-server-selector
        .amf="${amf}"
        autoSelect
      ></api-server-selector>
    `));
  }

  async function unselectableFixture(amf) {
    return (await fixture(html`
      <api-server-selector
        .amf="${amf}"
      >
      <anypoint-item slot="custom-base-uri">
        srv 1
      </anypoint-item>
      <anypoint-item slot="custom-base-uri" value="http://srv.com">
        srv 2
      </anypoint-item>
      </api-server-selector>
    `));
  }

  describe('basic usage', () => {
    it('renders empty dropdown', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.api-server-dropdown');
      assert.exists(node, 'dropdown exists');
      const items = node.querySelectorAll('anypoint-items');
      assert.lengthOf(items, 0, 'has no list items');
    });

    it('does not render custom input', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.uri-input');
      assert.notExists(node);
    });

    it('does not render custom value when allowCustom is not set', async () => {
      const element = await basicFixture();
      element.value = 'https://custom';
      await nextFrame();
      const node = element.shadowRoot.querySelector('.uri-input');
      assert.notExists(node);
    });

    it('does not render custom value when selection is made', async () => {
      const element = await extraOptionsFixture();
      element.value = 'http://customServer.com';
      await nextFrame();
      const node = element.shadowRoot.querySelector('.uri-input');
      assert.notExists(node);
    });

    it('renders custom uri input', async () => {
      const element = await customInputFixture();
      const node = element.shadowRoot.querySelector('.uri-input');
      assert.exists(node);
    });

    it('custom uri input has empty value', async () => {
      const element = await customInputFixture();
      const node = element.shadowRoot.querySelector('.uri-input');
      assert.equal(node.value, '');
    });

    it('renders empty slot', async () => {
      const element = await basicFixture();
      const slot = element.shadowRoot.querySelector('slot');
      assert.exists(slot);
      assert.lengthOf(slot.assignedElements(), 0)
    });

    it('does not render `Custom URI` option by default', async () => {
      const element = await basicFixture();
      assert.notExists(element.shadowRoot.querySelector('.custom-option'));
    });

    it('sets baseUri and renders as Custom', async () => {
      const element = await baseUriFixture();
      await nextFrame();
      element.allowCustom = false;
      assert.equal(element.value, 'https://www.google.com');
      assert.equal(element.type, 'custom');
      assert.equal(element.baseUri, 'https://www.google.com');
    });
  });

  describe('#allowCustom', () => {
    it('renders `Custom URI` option', async () => {
      const element = await allowCustomFixture();
      assert.exists(element.shadowRoot.querySelector('.custom-option'));
    });

    it('dispatched change event when the value changes', async () => {
      const element = await allowCustomFixture();
      const spy = sinon.spy();
      element.addEventListener('apiserverchanged', spy);
      element.value = 'https://example.com';
      assert.isTrue(spy.called, 'event is dispatched');
      const { detail } = spy.args[0][0];
      assert.deepEqual(detail, {
        value: 'https://example.com',
        type: 'custom',
      })
    });

    it('should select custom uri', async () => {
      const element = await allowCustomFixture();
      const node = element.shadowRoot.querySelector('[value="custom"]');
      node.click();
      assert.equal(element.value, '');
      assert.equal(element.type, 'custom');
    });

    it('removed the input when close is clicked', async () => {
      const element = await customInputFixture();
      element.value = 'test';
      const node = element.shadowRoot.querySelector('anypoint-icon-button');
      node.click();
      await nextFrame();
      assert.equal(element.value, '', 'value is reset');
      assert.equal(element.type, 'server', 'type is reset');
      assert.notExists(element.shadowRoot.querySelector('.uri-input'), 'input is removed');
    });

    it('resets when disabling the value', async () => {
      const element = await customInputFixture();
      element.allowCustom = false;
      assert.equal(element.type, 'server');
    });
  })

  describe('#baseUri', () => {
    let element;

    beforeEach(async () => {
      element = await baseUriFixture();
    });

    it('has baseUri as value', () => {
      assert.equal(element.value, 'https://www.google.com');
    })

    it('returns baseUri as value after setting the value', () => {
      element.value = 'test uri';
      assert.equal(element.value, 'https://www.google.com');
    })

    it('updates when new baseUri is set', () => {
      element.baseUri = 'https://www.google.com/v1';
      assert.equal(element.value, 'https://www.google.com/v1');
      assert.equal(element.baseUri, 'https://www.google.com/v1');
      assert.equal(element.type, 'custom');
    })
  });

  describe('slotted items', () => {
    it('has two assigned nodes to the slot', async () => {
      const element = await extraOptionsFixture();
      const nodes = element.shadowRoot.querySelector('slot[name="custom-base-uri"]').assignedElements();
      assert.lengthOf(nodes, 2);
    });

    it('has a total of 2 servers', async () => {
      const element = await extraOptionsFixture();
      assert.equal(element._serversCount, 2)
    });

    it('renders 2 servers', async () => {
      const element = await slotChangeFixture();
      assert.equal(element._serversCount, 2);
    })

    it('dispatches serverscountchanged event when a slot is added', async () => {
      const element = await slotChangeFixture();
      const toBeSlotted = element.children[2];
      const spy = sinon.spy();
      element.addEventListener('serverscountchanged', spy);
      toBeSlotted.setAttribute('slot', 'custom-base-uri');
      await nextFrame();

      assert.isTrue(spy.called, 'event is dispatched');
      const { detail } = spy.args[0][0];
      assert.deepEqual(detail, {
        value: 3
      });
    })

    it('renders 3 servers after the update', async () => {
      const element = await slotChangeFixture();
      const toBeSlotted = element.children[2];
      toBeSlotted.setAttribute('slot', 'custom-base-uri');
      await nextFrame();
      assert.equal(element._serversCount, 3);
    })
  });

  [
    ['Compact model', true],
    ['Regular model', false]
  ].forEach(([label, compact]) => {
    describe(`${label}`, () => {

      function dispatchNavigate(detail) {
        const e = new CustomEvent('api-navigation-selection-changed', {
          bubbles: true,
          detail
        });
        document.body.dispatchEvent(e);
      }

      describe('_renderServerOptions()', () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture(amf);
        });

        it('returns empty array when servers is null', () => {
          element.servers = null;
          assert.lengthOf(element._renderServerOptions(), 0);
        });

        it('returns list of servers for the document', () => {
          assert.lengthOf(element._renderServerOptions(), 4);
        });

        it('returns list of servers for an endpoint', async () => {
          const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
          const endpointId = endpoint['@id'];
          const detail = {
            selected: endpointId,
            type: 'endpoint',
          };
          dispatchNavigate(detail);
          await nextFrame();
          assert.lengthOf(element._renderServerOptions(), 1);
        });

        it('returns list of servers for a method', () => {
          const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
          const method = AmfHelper.getMethod(element, amf, '/ping', 'get');
          const endpointId = endpoint['@id'];
          const methodId = method['@id'];
          const detail = {
            selected: methodId,
            type: 'method',
            endpointId,
          };
          dispatchNavigate(detail);
          assert.lengthOf(element._renderServerOptions(), 2);
        });
      });

      describe('_handleSelectionChanged()', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        it('selects a server', async () => {
          const element = await basicFixture(amf);

          const node = element.shadowRoot.querySelector('[value="https://{customerId}.saas-app.com:{port}/v2"]');
          node.click();

          assert.equal(element.value, 'https://{customerId}.saas-app.com:{port}/v2');
          assert.equal(element.type, 'server');
        });

        it('selects custom URI', async () => {
          const element = await allowCustomFixture();

          const node = element.shadowRoot.querySelector('[value="custom"]');
          node.click();

          assert.equal(element.value, '');
          assert.equal(element.type, 'custom');
        });
      });

      describe('updateServers()', () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await basicFixture(amf);
        });

        it('updates servers for an endpoint', () => {
          const endpointId = AmfHelper.getEndpoint(element, amf, '/ping')['@id'];
          element.updateServers({ type: 'endpoint', id: endpointId });
          assert.lengthOf(element.servers, 1);
        });

        it('updates servers for a method', () => {
          const endpointId = AmfHelper.getEndpoint(element, amf, '/ping')['@id'];
          const methodId = AmfHelper.getMethod(element, amf, '/ping', 'get')['@id'];
          element.updateServers({ type: 'method', id: methodId, endpointId });
          assert.lengthOf(element.servers, 2);
        });
      });

      describe('apiserverscount event', () => {
        describe('initialization', () => {
          let element;
          let event;

          beforeEach(async () => {
            const handler = (e) => {
              event = e;
            }
            element = document.createElement('api-server-selector');
            element.addEventListener('serverscountchanged', handler);
            document.body.appendChild(element);
          });

          afterEach(() => {
            document.body.removeChild(element);
          });

          it('should render 0 servers', () => {
            assert.equal(element._serversCount, 0);
          });

          it('should have triggered event', () => {
            assert.deepEqual(event.detail, {
              value: 0
            });
          });
        });

        describe('allowCustom change', () => {
          let element;
          let event;

          beforeEach(async () => {
            element = await basicFixture();
            const handler = (e) => {
              event = e;
            }
            element.addEventListener('serverscountchanged', handler);
            element.allowCustom = true;
            await nextFrame();
          });

          it('should have triggered event', () => {
            assert.deepEqual(event.detail, {
              value: 1
            });
          })
        });
      });

      describe('anypoint compatibility', () => {
        let element;
        let amf;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await compatibilityFixture();
        });

        it('sets compatibility on the dropdown', () => {
          assert.isTrue(element.compatibility);
        });

        it('sets compatibility on the custom item', () => {
          const item = element.shadowRoot.querySelector('anypoint-item');
          assert.isTrue(item.hasAttribute('compatibility'));
        });

        it('sets compatibility on the server items', async () => {
          element.amf = amf;
          await nextFrame();
          // class="custom-option"
          const nodes = element.shadowRoot.querySelectorAll('anypoint-item');
          const items = Array.from(nodes).filter((node) => node.getAttribute('value') !== 'custom');
          assert.isAbove(items.length, 0);
          for (let i = 0; i < items.length; i++) {
            assert.isTrue(items[i].hasAttribute('compatibility'));
          }
        });

        it('sets compatibility on the custom input', async () => {
          element.type = 'custom';
          element.value = 'https://example.com';
          await nextFrame();
          const item = element.shadowRoot.querySelector('anypoint-input');
          assert.isTrue(item.hasAttribute('compatibility'));
        });
      });

      describe('outlined theme', () => {
        let element;

        beforeEach(async () => {
          element = await outlinedFixture();
        });

        it('sets outlined on the dropdown', () => {
          assert.isTrue(element.outlined);
        });

        it('sets outlined on the custom input', async () => {
          element.type = 'custom';
          element.value = 'https://example.com';
          await nextFrame();
          const item = element.shadowRoot.querySelector('anypoint-input');
          assert.isTrue(item.hasAttribute('outlined'));
        });
      });

      describe('slot elements', () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await extraOptionsFixture(amf);
        });

        it('selects slot value', async () => {
          element.value = 'http://customServer2.com';
          await nextFrame();
          assert.equal(element.value, 'http://customServer2.com');
        });
      });

      describe('auto selection', () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        it('selects a default server for the API model', async () => {
          const element = await autoSelectFixture(amf);
          assert.equal(element.value, 'https://{customerId}.saas-app.com:{port}/v2');
        });

        it('selects when changing selection to an endpoint', async () => {
          const element = await autoSelectFixture(amf);
          const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
          const endpointId = endpoint['@id'];
          const detail = {
            selected: endpointId,
            type: 'endpoint',
          };
          dispatchNavigate(detail);
          await nextFrame();
          assert.equal(element.value, 'https://endpoint.example.com');
        });

        it('selects when changing selection to a method', async () => {
          const element = await autoSelectFixture(amf);
          const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
          const method = AmfHelper.getMethod(element, amf, '/ping', 'get');
          const endpointId = endpoint['@id'];
          const methodId = method['@id'];
          const detail = {
            selected: methodId,
            type: 'method',
            endpointId,
          };
          dispatchNavigate(detail);
          await nextFrame();
          assert.equal(element.value, 'https://echo.example.com');
        });

        it('keeps selection when possible', async () => {
          const element = await autoSelectFixture(amf);
          const endpoint1 = AmfHelper.getEndpoint(element, amf, '/default');
          const method1 = AmfHelper.getMethod(element, amf, '/default', 'get');
          const endpoint2 = AmfHelper.getEndpoint(element, amf, '/duplicated');
          const method2 = AmfHelper.getMethod(element, amf, '/duplicated', 'get');

          dispatchNavigate({
            selected: method1['@id'],
            type: 'method',
            endpointId: endpoint1['@id'],
          });
          element.value = 'http://beta.api.openweathermap.org/data/2.5/';
          await nextFrame();
          dispatchNavigate({
            selected: method2['@id'],
            type: 'method',
            endpointId: endpoint2['@id'],
          });
          await nextFrame();
          assert.equal(element.value, 'http://beta.api.openweathermap.org/data/2.5/');
        });
      });

      describe('items without a value', () => {
        let element;
        let amf;

        before(async () => {
          amf = await AmfLoader.load(compact);
        });

        beforeEach(async () => {
          element = await unselectableFixture(amf);
        });

        it('do not select element that has no value', () => {
          // first item has no value
          const node = element.querySelector('anypoint-item');
          node.click();

          assert.equal(element.value, '');
        });
      });
    });
  });

  describe('onapiserverchange', () => {
    let element;
    beforeEach(async () => {
      element = await allowCustomFixture();
    });

    it('has no initial value', () => {
      assert.equal(element.onapiserverchange, null);
    });

    it('sets an event listener', () => {
      const fn = () => {};
      element.onapiserverchange = fn;
      assert.isTrue(element.onapiserverchange === fn);
    });

    it('calls the callback function', () => {
      let called = false;
      const fn = () => { called = true; };
      element.onapiserverchange = fn;
      element.value = 'https://example.com';
      assert.isTrue(called);
    });

    it('clears the callback function', () => {
      let called = false;
      const fn = () => { called = true; };
      element.onapiserverchange = fn;
      element.onapiserverchange = null;
      element.value = 'https://example.com';
      assert.isFalse(called);
    });

    it('unregisters old function', () => {
      let called1 = false;
      let called2 = false;
      const fn1 = () => { called1 = true; };
      const fn2 = () => { called2 = true; };
      element.onapiserverchange = fn1;
      element.onapiserverchange = fn2;
      element.value = 'https://example.com';
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onserverscountchange', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('has no initial value', () => {
      assert.equal(element.onserverscountchange, null);
    });

    it('sets an event listener', () => {
      const fn = () => {};
      element.onserverscountchange = fn;
      assert.isTrue(element.onserverscountchange === fn);
    });

    it('calls the callback function', async () => {
      let called = false;
      const fn = () => { called = true; };
      element.onserverscountchange = fn;
      element.allowCustom = true;
      await nextFrame();
      assert.isTrue(called);
    });

    it('clears the callback function', () => {
      let called = false;
      const fn = () => { called = true; };
      element.onserverscountchange = fn;
      element.onserverscountchange = null;
      element.allowCustom = true;
      assert.isFalse(called);
    });

    it('unregisters old function', () => {
      let called1 = false;
      let called2 = false;
      const fn1 = () => { called1 = true; };
      const fn2 = () => { called2 = true; };
      element.onserverscountchange = fn1;
      element.onserverscountchange = fn2;
      element.allowCustom = true;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('a11y', () => {
    let amf;

    before(async () => {
      amf = await AmfLoader.load(true);
    });

    it('is accessible when no selection', async () => {
      const element = await basicFixture(amf);
      await assert.isAccessible(element);
    });

    it('is accessible with selection', async () => {
      const element = await autoSelectFixture(amf);
      await assert.isAccessible(element);
    });

    it('is accessible with custom input', async () => {
      const element = await customInputFixture();
      await assert.isAccessible(element);
    });

    it('is accessible with light children', async () => {
      const element = await extraOptionsFixture();
      await assert.isAccessible(element);
    });
  });
});
