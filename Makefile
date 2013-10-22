
components: component.json
	@component install --dev

test: components
	@npm install
	@node test/server.js

clean:
	rm -rf test/build.js test/build.css test/components

.PHONY: test clean
