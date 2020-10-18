import {readHashVar, setHashVar} from "./state.js";
function parseBoolean(s) {
  switch (s.toLowerCase()) {
    case "t":
    case "true":
      return true;
    case "f":
    case "false":
      return false;
  }
  return null;
}
export function bindVars({data, ...acc}) {
  for (const name2 in data) {
    bindVar({
      ...acc,
      name: name2,
      load: () => data[name2],
      save: (v) => data[name2] = v
    });
  }
}
function bindVar({name: name2, load, save, getInput, getSelect}) {
  const value = load();
  const {stov, vtos} = tossers(value);
  switch (typeof value) {
    case "string":
      hookupInput({
        name: name2,
        input: getInput(name2),
        load,
        save,
        stov,
        vtos,
        read: (i) => i.value,
        write: (i, v) => i.value = typeof v === "string" ? v : v.toString()
      });
      break;
    case "number":
      hookupInput({
        name: name2,
        input: getInput(name2),
        load,
        save,
        stov,
        vtos,
        read: (i) => i.valueAsNumber,
        write: (i, v) => i.valueAsNumber = typeof v === "number" ? v : NaN
      });
      break;
    case "boolean":
      hookupInput({
        name: name2,
        input: getInput(name2),
        load,
        save,
        stov,
        vtos,
        read: (i) => i.checked,
        write: (i, v) => i.checked = typeof v === "boolean" ? v : false
      });
      break;
    case "object":
      if (value.value !== void 0 && value.options !== void 0) {
        const {stov: stov2, vtos: vtos2} = tossers(value.value);
        hookupSelect({
          name: name2,
          select: getSelect(name2),
          options: value.options,
          load: () => load().value,
          save: (value2) => save({value: value2, options: load().options}),
          stov: stov2,
          vtos: vtos2
        });
        return;
      }
      hookupInput({
        name: name2,
        input: getInput(name2),
        load,
        save,
        stov,
        vtos,
        read: (i) => {
          try {
            return JSON.parse(i.value);
          } catch (e) {
            return null;
          }
        },
        write: (i, v) => i.value = JSON.stringify(v)
      });
  }
}
function hookupInput({
  name: name2,
  input,
  load,
  save,
  stov,
  vtos,
  read,
  write
}) {
  const update = (value2) => {
    const given = value2 !== null && value2 !== void 0;
    if (!given)
      value2 = load();
    setHashVar(name2, vtos(value2));
    if (given)
      save(value2);
    if (input)
      write(input, value2);
  };
  if (input)
    input.addEventListener("change", () => update(read(input)));
  const value = readHashVar(name2);
  update(value === null ? load() : stov(value));
}
function hookupSelect({
  name: name2,
  select,
  options,
  load,
  save,
  stov,
  vtos
}) {
  const update = (value2) => {
    const given = value2 !== null && value2 !== void 0;
    if (!given)
      value2 = load();
    setHashVar(name2, vtos(value2));
    if (given)
      save(value2);
    if (select)
      select.value = value2;
  };
  if (select) {
    while (select.options.length)
      select.remove(0);
    for (const opt of options) {
      if (typeof opt === "string") {
        select.add(new Option(opt, opt));
      } else {
        const {label, value: value2} = opt;
        select.add(new Option(label, value2 === void 0 ? label : value2));
      }
    }
    select.addEventListener("change", () => update(stov(select.value)));
  }
  const value = readHashVar(name2);
  update(value === null ? load() : stov(value));
}
function tossers(value) {
  switch (typeof value) {
    case "string":
      return {
        stov: (s) => s,
        vtos: (v) => typeof v === "string" ? v : v.toString()
      };
    case "number":
      return {
        stov: (s) => s ? parseFloat(s) : null,
        vtos: (v) => typeof v === "number" ? v.toString() : ""
      };
    case "boolean":
      return {
        stov: (s) => s ? parseBoolean(s) : null,
        vtos: (v) => typeof v === "boolean" ? v.toString() : ""
      };
    case "object":
      return {
        stov: (s) => JSON.parse(s),
        vtos: (v) => JSON.stringify(v)
      };
    default:
      throw new Error(`unupported ${name} setting of type ${typeof value}`);
  }
}
//# sourceMappingURL=config.js.map
