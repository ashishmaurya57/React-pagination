import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableSelectionChangeEvent, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputSwitch } from 'primereact/inputswitch';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import axios from 'axios';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const ArtworksTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rowClick, setRowClick] = useState(true);
  const overlayPanel = useRef<OverlayPanel>(null);
  const [checkRowsCount, setCheckRowsCount] = useState<number>(0);

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  useEffect(() => {
    checkRowsAcrossPages(checkRowsCount);
  }, [checkRowsCount]);

  const fetchArtworks = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}`);
      const data = response.data.data;
      const artworksData = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      setArtworks(artworksData);
      setTotalRecords(response.data.pagination.total);

      const selectedRowsOnPage = artworksData.filter((artwork: Artwork) => selectedIds.has(artwork.id));
      setSelectedArtworks(selectedRowsOnPage);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: DataTablePageEvent) => {
    setPage(event.page + 1);
  };

  const onRowSelect = (event: DataTableSelectionChangeEvent) => {
    const selectedIdsUpdate = new Set(event.value.map((item: Artwork) => item.id));

    const newSelectedIds = new Set(selectedIds);
    for (const id of selectedIdsUpdate) {
      newSelectedIds.add(id);
    }
    for (const id of selectedIds) {
      if (!selectedIdsUpdate.has(id)) {
        newSelectedIds.delete(id);
      }
    }

    setSelectedIds(newSelectedIds);
    setSelectedArtworks(event.value);
  };

  const checkRowsAcrossPages = async (rowsToCheck: number) => {
    let remainingRows = rowsToCheck;
    let currentPage = 1;

    while (remainingRows > 0 && currentPage <= Math.ceil(totalRecords / 10)) {
      const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${currentPage}`);
      const data = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      const availableRows = data.length;
      const selectedRowsOnPage = data.filter((artwork: Artwork) => selectedIds.has(artwork.id));

      if (selectedRowsOnPage.length > rowsToCheck) {
        selectedRowsOnPage.slice(rowsToCheck).forEach((row: Artwork) => selectedIds.delete(row.id));
        setSelectedIds(new Set(selectedIds));
        break;
      }

      const rowsToSelect = data.slice(0, Math.min(availableRows, remainingRows));
      rowsToSelect.forEach((row: Artwork) => selectedIds.add(row.id));
      remainingRows -= rowsToSelect.length;
      currentPage++;
    }

    const updatedSelectedArtworks = artworks.filter((artwork: Artwork) => selectedIds.has(artwork.id));
    setSelectedArtworks(updatedSelectedArtworks);
  };

  const handleCheckRowsInput = () => {
    checkRowsAcrossPages(checkRowsCount);
    overlayPanel.current?.hide();
  };

  return (
    <div className="card">
      <div className="flex justify-content-center align-items-center mb-4 gap-2">
        <InputSwitch
          inputId="input-rowclick"
          checked={rowClick}
          onChange={(e) => setRowClick(e.value)}
        />
        <label htmlFor="input-rowclick">Row Click</label>
      </div>

      <DataTable
        value={artworks}
        paginator
        rows={10}
        totalRecords={totalRecords}
        loading={loading}
        lazy
        onPage={onPageChange}
        selection={selectedArtworks}
        onSelectionChange={onRowSelect}
        dataKey="id"
        selectionMode={rowClick ? null : 'checkbox'}
        tableStyle={{ minWidth: '50rem' }}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column
          field="title"
          header={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              Title
              <Button
                icon="pi pi-filter"
                className="p-button-text p-ml-2"
                onClick={(e) => overlayPanel.current?.toggle(e)}
              />
            </div>
          }
        />
        <Column field="place_of_origin" header="Place of Origin" sortable></Column>
        <Column field="artist_display" header="Artist" sortable></Column>
        <Column field="inscriptions" header="Inscriptions" sortable></Column>
        <Column field="date_start" header="Date Start" sortable></Column>
        <Column field="date_end" header="Date End" sortable></Column>
      </DataTable>

      <OverlayPanel ref={overlayPanel}>
        <div className="p-field">
          <label htmlFor="rowsToCheck">Number of rows to check:</label>
          <input
            id="rowsToCheck"
            type="number"
            className="p-inputtext"
            value={checkRowsCount}
            onChange={(e) => setCheckRowsCount(Number(e.target.value))}
          />
        </div>
        <Button label="Check Rows" onClick={handleCheckRowsInput} />
      </OverlayPanel>
    </div>
  );
};

export default ArtworksTable;
