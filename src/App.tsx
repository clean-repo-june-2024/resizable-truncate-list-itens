import { useState, useEffect, useRef, createRef } from "react";
import { ResizableBox } from "react-resizable";
import lodash from "lodash";
import "react-resizable/css/styles.css";

interface ItemType {
  value: string | number;
  label: string;
}

const createData = (count: number): ItemType[] => {
  const data: ItemType[] = new Array(count).fill(undefined).map((_, index) => ({
    value: index,
    label: `Label ${index}`,
  }));

  return data;
};

const RenderItem = ({ label, itemRef, _key }: { label: string; itemRef: React.RefObject<HTMLDivElement>,  }) => (
  <div ref={itemRef} id={_key}  className="whitespace-nowrap px-2 py-1 bg-slate-500 opacity-85 truncate !min-w-14 ">
    {label}
  </div>
);

const PlusItem = ({ label, itemRef }: { label: string; itemRef: React.RefObject<HTMLDivElement> }) => (
  <div ref={itemRef} className="whitespace-nowrap px-2 py-1 bg-slate-500 opacity-85">
    {label}
  </div>
);

const deepCopyRefValue = (ref: React.RefObject<any>) => {
  // Create a new ref
  const newRef = createRef<any>();

  // Deep copy logic for DOM node
  if (ref.current instanceof HTMLElement) {
    newRef.current = ref.current.cloneNode(true);
  } else {
    // Handle other types if necessary
    newRef.current = JSON.parse(JSON.stringify(ref.current));
  }

  return newRef;
};

const App = () => {
  const [responsive, setResponsive] = useState(true);
  const [data, setData] = useState(createData(3));
  const [visibleCount, setVisibleCount] = useState(data.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(data.map(() => createRef<HTMLDivElement>()));
  const initialRefs = useRef<React.RefObject<HTMLDivElement>[] | undefined>(undefined);
  const prevContainerWidthRef = useRef<number | null>(null);

  useEffect(() => {
    initialRefs.current = itemRefs.current.map(item => lodash.cloneDeep((item)) )
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (containerRef.current && initialRefs.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const restWidth = 50; // Approximate width of the +N... indicator
        let totalWidth = 0;
        let maxVisibleItems = 0;

        const isGrowing = prevContainerWidthRef.current !== null && containerWidth > prevContainerWidthRef.current;
        console.log("isGrowing", initialRefs);

        const _list = [
          ...itemRefs.current,
          ...initialRefs.current.filter(
            initialRef => !itemRefs.current.some(itemRef => itemRef.current?.id === initialRef.current?.id)
          )
        ];

        const refsToUse = isGrowing ? _list : itemRefs.current;
        console.log('refsToUse', refsToUse);

        for (let i = 0; i < refsToUse.length; i++) {
          const itemRef = refsToUse[i];
          if (itemRef.current) {
            totalWidth += itemRef.current.offsetWidth;
            if (totalWidth + restWidth > containerWidth) {
              break;
            }
            maxVisibleItems++;
          }
        }

        setVisibleCount(maxVisibleItems);
        prevContainerWidthRef.current = containerWidth;
      }
      
    };

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateVisibleCount(); // Initial calculation

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [data.length]);

  useEffect(() => {
    itemRefs.current = data.map((_, i) => itemRefs.current[i] || createRef<HTMLDivElement>());
    initialRefs.current = [...itemRefs.current];
  }, [data]);

  return (
    <div style={{ padding: 32 }}>
      <button
        type="button"
        onClick={() => {
          setResponsive(!responsive);
        }}
      >
        {responsive ? 'Responsive' : 'MaxCount: 6'}
      </button>
      <input
        type="number"
        min="0"
        max="200"
        step="1"
        value={data.length}
        onChange={({ target: { value } }) => {
          setData(createData(Number(value)));
        }}
        style={{ width: 200, height: 32 }}
      />
      <input
        type="range"
        min="0"
        max="200"
        step="1"
        value={data.length}
        onChange={({ target: { value } }) => {
          setData(createData(Number(value)));
        }}
        style={{ width: 200, height: 32 }}
      />

      <ResizableBox
        width={300}
        height={200}
        minConstraints={[100, 200]}
        maxConstraints={[600, 200]}
        axis="x"
        resizeHandles={['e']}
      >
        <div
          ref={containerRef}
          className="flex gap-2 w-full overflow-hidden border-2 border-green-500 p-2"
        >
          {data.slice(0, visibleCount).map((item, index) => (
            <RenderItem key={item.value} label={String(item.label)} itemRef={itemRefs.current[index]} _key={item.value} />
          ))}
          {data.length > visibleCount && <PlusItem label={`+${data.length - visibleCount}`} itemRef={createRef()} />}
        </div>
      </ResizableBox>
    </div>
  );
};

export default App;