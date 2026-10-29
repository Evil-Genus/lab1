import { DOMParser, DOMImplementation, XMLSerializer, Element } from '@xmldom/xmldom';
import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Numbers } from '../domain/Numbers.js';
import { DocumentCodec } from '../application/DocumentCodec.js';
export class SvgCodec implements DocumentCodec {
  private readonly factory = new ShapeFactory();
  private readonly namespace = 'http://www.w3.org/2000/svg';
  decode(source: string): {document: Document; warnings: string[]} {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('unsupported SVG: DTD/entities');
    const xml = new DOMParser({onError: (_level, message) => { throw new Error('invalid SVG: ' + message); }}).parseFromString(source,'image/svg+xml');
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || root.namespaceURI !== this.namespace || root.getAttribute('xmlns') !== this.namespace) throw new Error('expected SVG root with SVG namespace');
    for (let i=0;i<root.attributes.length;i++) {
      const key = root.attributes.item(i)!.name;
      if (!['xmlns','width','height','viewBox'].includes(key)) throw new Error('unsupported SVG root attribute: ' + key);
    }
    const document = new Document(Numbers.parse(root.getAttribute('width') || '800'),Numbers.parse(root.getAttribute('height') || '600'));
    const viewBox = root.getAttribute('viewBox');
    if (viewBox && viewBox.trim().split(/[\s,]+/).map(Number).join(' ') !== [0,0,document.width,document.height].join(' '))
      throw new Error('unsupported viewBox: expected 0 0 width height');
    const warnings: string[] = [], reserved = new Set<string>();
    const elements = Array.from(root.getElementsByTagName('*'));
    for (const element of elements) {
      const id = element.getAttribute('id');
      if (id) {
        if (reserved.has(id)) throw new Error('id already exists: ' + id);
        reserved.add(id);
      }
    }
    const read = (element: Element): Shape => {
      if (element.namespaceURI !== this.namespace) throw new Error('unsupported SVG namespace');
      const type = element.localName!;
      let id = element.getAttribute('id');
      if (!id) {
        let index = 1; while (reserved.has(type + index)) index++;
        id = type + index; reserved.add(id);
        warnings.push('warning: assigned id ' + id + ' to unnamed <' + type + '>');
      }
      // XML names must remain ordinary keys, including JavaScript prototype names.
      const attrs: Record<string,string> = Object.create(null);
      for (let i=0;i<element.attributes.length;i++) {
        const attr = element.attributes.item(i)!;
        if (attr.name !== 'id' && attr.name !== 'transform') attrs[attr.name] = attr.value;
      }
      const shape = this.factory.fromAttributes(type,id,attrs,element.textContent || '');
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType === 1) {
          if (!(shape instanceof Group)) throw new Error('unsupported child element in ' + type);
          shape.insert(read(node as Element));
        } else if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim() && shape.text === undefined)
          throw new Error('unexpected text in ' + type);
      }
      const transform = element.getAttribute('transform');
      if (transform) {
        if (!(shape instanceof Group)) throw new Error('transform is supported on g only');
        this.transform(shape,transform);
      }
      return shape;
    };
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType === 1) document.add(read(node as Element));
      else if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim()) throw new Error('unexpected text in svg');
    }
    return {document,warnings};
  }
  private transform(shape: Shape, source: string): void {
    const operations = [...source.matchAll(/(translate|scale)\s*\(([^)]*)\)/g)];
    if (source.replace(/(translate|scale)\s*\(([^)]*)\)/g,'').trim() || !operations.length) throw new Error('unsupported transform: ' + source);
    for (const operation of operations.reverse()) {
      const args = operation[2].trim().split(/[\s,]+/).map(v=>Numbers.parse(v));
      if (args.length < 1 || args.length > 2) throw new Error('invalid transform: ' + source);
      if (operation[1] === 'translate') shape.move(args[0],args[1] ?? 0);
      else {
        if (args.length === 2 && args[0] !== args[1]) throw new Error('only uniform scale is supported');
        shape.scale(args[0]);
      }
    }
  }
  encode(document: Document): string {
    const xml = new DOMImplementation().createDocument(this.namespace,'svg',null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns',this.namespace);
    root.setAttribute('width',String(document.width)); root.setAttribute('height',String(document.height));
    root.setAttribute('viewBox',[0,0,document.width,document.height].join(' '));
    const append = (shape: Shape, parent: Element): void => {
      const element = xml.createElementNS(this.namespace,shape.tag); element.setAttribute('id',shape.id);
      for (const [key,value] of Object.entries(shape.attributes())) element.setAttribute(key,value);
      if (shape.text !== undefined) element.appendChild(xml.createTextNode(shape.text));
      shape.children.forEach(s=>append(s,element)); parent.appendChild(element);
    };
    document.children.forEach(s=>append(s,root));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }
}
